import { GameContainer } from '../components/Game/GameContainer'
import { ErrorBoundary } from '../components/ErrorBoundary'

export function Game() {
  return (
    <ErrorBoundary>
      <GameContainer />
    </ErrorBoundary>
  )
}
