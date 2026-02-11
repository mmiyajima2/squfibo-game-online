import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { GameContainer } from '../components/Game/GameContainer'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { sendReady, connectSocket, getSocket, joinRoom } from '../lib/socket'
import type { ErrorPayload, RoomJoinedPayload } from '../lib/socket'

export function Game() {
  const { roomId, playerId: urlPlayerId } = useParams<{ roomId: string; playerId: string }>()
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role')

  const [playerRole, setPlayerRole] = useState<'host' | 'guest' | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(urlPlayerId || null)
  const [guestUrl, setGuestUrl] = useState<string>('')
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [hasJoined, setHasJoined] = useState(false)

  // ゲストとしてアクセスしたかどうか
  const isGuestAccess = roleParam === 'guest' && !urlPlayerId

  // オンライン対戦かどうか判定
  const isOnlineMode = Boolean(roomId && (playerId || isGuestAccess))

  useEffect(() => {
    if (isOnlineMode) {
      // ゲストアクセスの場合
      if (isGuestAccess) {
        setPlayerRole('guest')
      } else {
        // ホストまたは既にplayerIdがある場合
        const role = localStorage.getItem('squfibo_player_role') as 'host' | 'guest' | null
        const storedGuestUrl = localStorage.getItem('squfibo_guest_url') || ''

        setPlayerRole(role)
        setGuestUrl(storedGuestUrl)
      }

      // Socket.io接続
      connectSocket()

      // gameStartイベントのリスナーを設定
      const socket = getSocket()
      socket.on('gameStart', (data) => {
        console.log('[Game] Game started:', data)
        // TODO: ゲーム開始処理
      })

      return () => {
        socket.off('gameStart')
      }
    }
  }, [isOnlineMode, roomId, playerId, isGuestAccess])

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()

    if (!roomId || !playerName.trim()) {
      setError('プレイヤー名を入力してください')
      return
    }

    if (playerName.trim().length > 20) {
      setError('プレイヤー名は20文字以内で入力してください')
      return
    }

    setIsJoining(true)
    setError(null)

    joinRoom(
      roomId,
      playerName.trim(),
      (data: RoomJoinedPayload) => {
        console.log('[Game] Joined room:', data)
        setPlayerId(data.playerId)
        setHasJoined(true)
        setIsJoining(false)

        // ローカルストレージに保存
        localStorage.setItem('squfibo_room_id', roomId)
        localStorage.setItem('squfibo_player_id', data.playerId)
        localStorage.setItem('squfibo_player_role', 'guest')
      },
      (error: ErrorPayload) => {
        setIsJoining(false)
        setError(error.message || '部屋への参加に失敗しました')
      }
    )
  }

  const handleReady = () => {
    if (!roomId || !playerId) return

    sendReady(
      roomId,
      playerId,
      (error: ErrorPayload) => {
        setError(error.message || '準備完了の送信に失敗しました')
      }
    )

    setIsReady(true)
    setError(null)
  }

  const handleCopyGuestUrl = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
      setError('URLのコピーに失敗しました')
    }
  }

  // ローカルゲーム（URLパラメータなし）
  if (!isOnlineMode) {
    return (
      <ErrorBoundary>
        <GameContainer />
      </ErrorBoundary>
    )
  }

  // ゲストがまだ部屋に参加していない場合、参加フォームを表示
  if (isGuestAccess && !hasJoined) {
    return (
      <ErrorBoundary>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#1a1a2e'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: '#16213e',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '30px' }}>
              対戦部屋に参加
            </h1>

            <p style={{ color: '#aaa', marginBottom: '20px', textAlign: 'center' }}>
              部屋ID: <span style={{ color: '#fff' }}>{roomId}</span>
            </p>

            <form onSubmit={handleJoinRoom}>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="playerName" style={{ color: '#fff', display: 'block', marginBottom: '10px' }}>
                  あなたのプレイヤー名
                </label>
                <input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="プレイヤー名を入力（1〜20文字）"
                  maxLength={20}
                  disabled={isJoining}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#0f3460',
                    color: '#fff',
                    fontSize: '16px'
                  }}
                />
              </div>

              {error && (
                <div style={{
                  backgroundColor: '#e94560',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isJoining}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#e94560',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: isJoining ? 'default' : 'pointer',
                  opacity: isJoining ? 0.7 : 1
                }}
              >
                {isJoining ? '参加中...' : '部屋に参加'}
              </button>
            </form>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  // オンライン対戦の準備画面
  return (
    <ErrorBoundary>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#1a1a2e'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          backgroundColor: '#16213e',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '30px' }}>
            オンライン対戦準備
          </h1>

          {/* 上側エリア（相手側） */}
          <div style={{
            backgroundColor: '#0f3460',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px',
            minHeight: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {playerRole === 'host' && guestUrl && (
              <div style={{ width: '100%' }}>
                <h3 style={{ color: '#fff', marginBottom: '10px', fontSize: '14px' }}>
                  ゲスト用URL（友達に送ってください）
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={guestUrl}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#1a1a2e',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <button
                    onClick={handleCopyGuestUrl}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: copiedUrl ? '#27ae60' : '#e94560',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {copiedUrl ? 'コピー完了！' : 'コピー'}
                  </button>
                </div>
              </div>
            )}
            {playerRole === 'guest' && (
              <p style={{ color: '#aaa', textAlign: 'center' }}>相手の準備を待っています...</p>
            )}
          </div>

          {/* 情報表示 */}
          <div style={{
            backgroundColor: '#0f3460',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <p style={{ color: '#aaa', marginBottom: '10px' }}>
              部屋ID: <span style={{ color: '#fff' }}>{roomId}</span>
            </p>
            <p style={{ color: '#aaa', marginBottom: '10px' }}>
              あなたの役割: <span style={{ color: '#fff' }}>{playerRole === 'host' ? 'ホスト' : 'ゲスト'}</span>
            </p>
            <p style={{ color: '#aaa' }}>
              プレイヤーID: <span style={{ color: '#fff', fontSize: '12px' }}>{playerId}</span>
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#e94560',
              color: '#fff',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* 下側エリア（自分側） */}
          <div style={{
            backgroundColor: '#0f3460',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
          }}>
            <h3 style={{ color: '#fff', fontSize: '16px' }}>
              {isReady ? '準備完了しました！' : '準備ができたらボタンを押してください'}
            </h3>
            <button
              onClick={handleReady}
              disabled={isReady}
              style={{
                padding: '15px 40px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isReady ? '#27ae60' : '#e94560',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: isReady ? 'default' : 'pointer',
                opacity: isReady ? 0.7 : 1
              }}
            >
              {isReady ? '✓ 準備完了' : '準備完了'}
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
