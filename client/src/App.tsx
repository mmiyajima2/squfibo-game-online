import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Welcome } from './pages/Welcome'
import { Game } from './pages/Game'
import { Manual } from './pages/Manual'
import { Privacy } from './pages/Privacy'
import { Terms } from './pages/Terms'
import { About } from './pages/About'
import { Sitemap } from './pages/Sitemap'
import { ScrollToTop } from './components/ScrollToTop'
import './App.css'

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/game" element={<Game />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/about" element={<About />} />
        <Route path="/sitemap" element={<Sitemap />} />
      </Routes>
    </Router>
  )
}

export default App
