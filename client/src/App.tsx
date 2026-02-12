import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Welcome } from './pages/Welcome'
import { Game } from './pages/Game'
import { Manual } from './pages/Manual'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/game" element={<Game />} />
        <Route path="/manual" element={<Manual />} />
      </Routes>
    </Router>
  )
}

export default App
