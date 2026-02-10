import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreateRoomDialog } from '../components/CreateRoomDialog'
import './Welcome.css'

export function Welcome() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  return (
    <div className="welcome-container">
      <header className="welcome-header">
        <h1 className="welcome-title">SquFibo</h1>
        <p className="welcome-subtitle">すくふぃぼ</p>
      </header>

      <main className="welcome-main">
        <section className="welcome-description">
          <h2>SquFiboとは？</h2>
          <p>
            SquFiboは、数字と色を使った戦略的なカードゲームです。
            <br />
            同じ色の数字を組み合わせて「役」を作り、
            <br />
            より多くの星を獲得したプレイヤーが勝利します。
          </p>
          <p>
            簡単なルールで奥深い戦略が楽しめる、2人対戦型のボードゲームです。
          </p>
        </section>

        <section className="welcome-actions">
          <button onClick={handleOpenDialog} className="btn btn-primary btn-large">
            オンライン版を開始する
          </button>
          <Link to="/game" className="btn btn-secondary btn-large">
            ブラウザ版で遊ぶ
          </Link>
        </section>

        <section className="welcome-links">
          <Link to="/manual" className="link-manual">
            📖 ゲームのマニュアルを見る
          </Link>
        </section>

        <aside className="welcome-ad">
          <div className="ad-placeholder">
            <p>広告エリア</p>
            <p className="ad-note">（Google AdSense用）</p>
          </div>
        </aside>
      </main>

      <footer className="welcome-footer">
        <p>
          <a href="mailto:bunbnil@buntozu.com" className="contact-link">
            お問い合わせ: bunbnil@buntozu.com
          </a>
        </p>
        <p>&copy; 2026 SquFibo Game</p>
      </footer>

      <CreateRoomDialog isOpen={isDialogOpen} onClose={handleCloseDialog} />
    </div>
  )
}
