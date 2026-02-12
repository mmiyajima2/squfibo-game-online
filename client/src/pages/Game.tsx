import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GameContainer } from '../components/Game/GameContainer'
import { ErrorBoundary } from '../components/ErrorBoundary'

export function Game() {
  const [searchParams] = useSearchParams()

  // query parameterを取得
  const playerName = searchParams.get('playerName')
  const role = searchParams.get('role')
  const roomId = searchParams.get('roomId')
  const playerId = searchParams.get('playerId')

  useEffect(() => {
    // オンライン版として起動された場合の情報をログ出力（デバッグ用）
    if (playerName && role && roomId && playerId) {
      console.log('オンラインゲームモード:', {
        playerName,
        role,
        roomId,
        playerId,
      })
    }
  }, [playerName, role, roomId, playerId])

  return (
    <ErrorBoundary>
      <GameContainer />
    </ErrorBoundary>
  )
}
