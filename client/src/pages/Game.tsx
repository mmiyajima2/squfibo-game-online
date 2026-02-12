import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLocalStorage } from 'usehooks-ts'
import { GameContainer } from '../components/Game/GameContainer'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { JoinRoomDialog } from '../components/JoinRoomDialog'
import { socket } from '../lib/socket'
import type { RoomJoinedPayload } from '../lib/socket'

type PlayerRole = 'host' | 'guest'

// ゲストURLコピーフィールドコンポーネント
function GuestUrlCopyField({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false)
  const guestUrl = `${window.location.origin}/game?roomId=${roomId}&role=guest`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('URLのコピーに失敗しました:', error)
    }
  }

  return (
    <div className="guest-url-container">
      <div className="guest-url-label">ゲスト招待用URL</div>
      <div className="guest-url-input-wrapper">
        <input
          type="text"
          value={guestUrl}
          readOnly
          className="guest-url-input"
          onClick={(e) => e.currentTarget.select()}
        />
        <button
          onClick={handleCopy}
          className={`guest-url-copy-button ${copied ? 'copied' : ''}`}
        >
          {copied ? 'コピー完了!' : 'コピー'}
        </button>
      </div>
    </div>
  )
}

export function Game() {
  const [searchParams] = useSearchParams()

  // query parameterを取得
  const playerNameParam = searchParams.get('playerName')
  const roleParam = searchParams.get('role') as PlayerRole | null
  const roomIdParam = searchParams.get('roomId')
  const playerIdParam = searchParams.get('playerId')

  // localStorageに保存（読み取りは不要なのでsetterのみ使用）
  const [, setStoredPlayerName] = useLocalStorage<string | null>(
    'squfibo-online-playerName',
    null
  )
  const [, setStoredRole] = useLocalStorage<PlayerRole | null>(
    'squfibo-online-role',
    null
  )
  const [, setStoredRoomId] = useLocalStorage<string | null>(
    'squfibo-online-roomId',
    null
  )
  const [, setStoredPlayerId] = useLocalStorage<string | null>(
    'squfibo-online-playerId',
    null
  )

  // ゲスト参加用のstate
  const [guestPlayerName, setGuestPlayerName] = useState<string | null>(null)
  const [guestPlayerId, setGuestPlayerId] = useState<string | null>(null)
  const [showJoinDialog, setShowJoinDialog] = useState(false)

  // オンラインモード判定
  // ゲストの場合、ダイアログで入力した情報も考慮
  const actualPlayerName = playerNameParam || guestPlayerName
  const actualPlayerId = playerIdParam || guestPlayerId
  const isOnlineMode = !!(actualPlayerName && roleParam && roomIdParam && actualPlayerId)

  // 準備完了状態
  const [isReady, setIsReady] = useState(false)
  const [isWaitingForGameStart, setIsWaitingForGameStart] = useState(false)
  const [opponentPlayerName, setOpponentPlayerName] = useState<string | null>(null)

  // ゲスト参加ダイアログの表示判定
  useEffect(() => {
    // role=guest かつ roomId があり、playerName がない場合、ダイアログを表示
    if (roleParam === 'guest' && roomIdParam && !playerNameParam && !guestPlayerName) {
      setShowJoinDialog(true)
    }
  }, [roleParam, roomIdParam, playerNameParam, guestPlayerName])

  // ゲスト参加成功時の処理
  const handleJoinRoomSuccess = (data: RoomJoinedPayload, playerName: string) => {
    console.log('部屋に参加しました:', data)
    setGuestPlayerName(playerName)
    setGuestPlayerId(data.playerId)
    setOpponentPlayerName(data.hostPlayerName)
    setShowJoinDialog(false)

    // localStorageに保存
    setStoredPlayerName(playerName)
    setStoredPlayerId(data.playerId)
    setStoredRole('guest')
    setStoredRoomId(data.roomId)
  }

  // query paramsをlocalStorageに保存
  useEffect(() => {
    if (isOnlineMode) {
      setStoredPlayerName(playerNameParam)
      setStoredRole(roleParam)
      setStoredRoomId(roomIdParam)
      setStoredPlayerId(playerIdParam)

      console.log('オンラインゲームモード:', {
        playerName: playerNameParam,
        role: roleParam,
        roomId: roomIdParam,
        playerId: playerIdParam,
      })
    }
  }, [
    isOnlineMode,
    playerNameParam,
    roleParam,
    roomIdParam,
    playerIdParam,
    setStoredPlayerName,
    setStoredRole,
    setStoredRoomId,
    setStoredPlayerId,
  ])

  // Socket.io イベントリスナー
  useEffect(() => {
    if (!isOnlineMode) return

    // ゲスト参加通知を受信（ホストのみ）
    const handlePlayerJoined = (data: { playerName: string; playerId: string }) => {
      console.log('ゲストが参加しました:', data)
      setOpponentPlayerName(data.playerName)
    }

    // ゲーム開始通知を受信
    const handleGameStart = (data: any) => {
      console.log('ゲーム開始:', data)
      setIsWaitingForGameStart(false)
      // TODO: ゲーム状態をサーバーから受け取った状態で初期化
    }

    socket.on('playerJoined', handlePlayerJoined)
    socket.on('gameStart', handleGameStart)

    return () => {
      socket.off('playerJoined', handlePlayerJoined)
      socket.off('gameStart', handleGameStart)
    }
  }, [isOnlineMode])

  // 準備完了ボタンの押下処理
  const handleReady = () => {
    if (!roomIdParam) return

    console.log('準備完了を送信:', { roomId: roomIdParam })
    socket.emit('ready', { roomId: roomIdParam }, (response: any) => {
      if (response?.success) {
        setIsReady(true)
        setIsWaitingForGameStart(true)
        console.log('準備完了しました')
      } else {
        console.error('準備完了に失敗:', response?.error)
      }
    })
  }

  // ゲストURLフィールド（ホストのみ、ゲスト未参加時に表示）
  const guestUrlField = isOnlineMode && roleParam === 'host' && !opponentPlayerName && roomIdParam
    ? <GuestUrlCopyField roomId={roomIdParam} />
    : undefined

  return (
    <ErrorBoundary>
      {/* ゲスト参加ダイアログ */}
      {showJoinDialog && roomIdParam && (
        <JoinRoomDialog
          isOpen={showJoinDialog}
          roomId={roomIdParam}
          onClose={() => setShowJoinDialog(false)}
          onSuccess={handleJoinRoomSuccess}
        />
      )}

      <GameContainer
        isOnlineMode={isOnlineMode}
        role={roleParam}
        playerName={actualPlayerName}
        opponentPlayerName={opponentPlayerName}
        isReady={isReady}
        isWaitingForGameStart={isWaitingForGameStart}
        onReady={handleReady}
        guestUrlField={guestUrlField}
      />
    </ErrorBoundary>
  )
}
