import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLocalStorage } from 'usehooks-ts'
import { GameContainer } from '../components/Game/GameContainer'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { JoinRoomDialog } from '../components/JoinRoomDialog'
import { socket } from '../lib/socket'
import type { RoomJoinedPayload } from '../lib/socket'
import { useOnlineGame } from '../hooks/useOnlineGame'

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

  // オンラインゲーム用のフック
  const onlineGame = useOnlineGame({
    roomId: roomIdParam,
    playerId: actualPlayerId,
    role: roleParam,
    playerName: actualPlayerName,
    enabled: isOnlineMode,
  })

  // オンラインモードの場合はuseOnlineGameから状態を取得
  const isReady = isOnlineMode ? onlineGame.isReady : false
  const isWaitingForGameStart = isOnlineMode ? onlineGame.isWaitingForGameStart : false
  const opponentPlayerName = isOnlineMode ? onlineGame.opponentPlayerName : null

  // ゲスト参加ダイアログの表示判定
  useEffect(() => {
    console.log('[Game] ダイアログ表示判定 useEffect:', {
      roleParam,
      roomIdParam,
      playerNameParam,
      guestPlayerName,
      showJoinDialog,
    })
    // role=guest かつ roomId があり、playerName がない場合、ダイアログを表示
    if (roleParam === 'guest' && roomIdParam && !playerNameParam && !guestPlayerName) {
      console.log('[Game] ダイアログを表示します')
      setShowJoinDialog(true)
    }
  }, [roleParam, roomIdParam, playerNameParam, guestPlayerName])

  // ゲスト参加成功時の処理
  const handleJoinRoomSuccess = (data: RoomJoinedPayload, playerName: string) => {
    console.log('[Game] handleJoinRoomSuccess called:', data, playerName)

    try {
      // ダイアログを最初に閉じる（重要：他の状態更新の前に実行）
      console.log('[Game] Closing dialog first')
      setShowJoinDialog(false)
      console.log('[Game] setShowJoinDialog(false) called')

      // 他の状態を更新
      console.log('[Game] Setting guestPlayerName to:', playerName)
      setGuestPlayerName(playerName)

      console.log('[Game] Setting guestPlayerId to:', data.playerId)
      setGuestPlayerId(data.playerId)

      const hostName = data.roomInfo?.hostPlayerName || 'Unknown Host'
      console.log('[Game] Setting opponentPlayerName to:', hostName)
      setOpponentPlayerName(hostName)

      // localStorageに保存
      setStoredPlayerName(playerName)
      setStoredPlayerId(data.playerId)
      setStoredRole('guest')
      setStoredRoomId(data.roomId)
      console.log('[Game] All states updated')
    } catch (error) {
      console.error('[Game] Error in handleJoinRoomSuccess:', error)
    }
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

  // 準備完了ボタンの押下処理
  const handleReady = () => {
    if (isOnlineMode) {
      onlineGame.sendReady()
    }
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
        onlineGameState={isOnlineMode ? onlineGame : undefined}
      />
    </ErrorBoundary>
  )
}
