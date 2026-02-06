import { GameContainer } from './components/Game/GameContainer'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <GameContainer />
    </ErrorBoundary>
  )
}

export default App
