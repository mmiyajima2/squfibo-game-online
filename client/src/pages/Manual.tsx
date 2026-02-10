import { Link } from 'react-router-dom'
import './Welcome.css'

export function Manual() {
  return (
    <div className="welcome-container">
      <header className="welcome-header">
        <h1 className="welcome-title">マニュアル</h1>
        <p className="welcome-subtitle">SquFibo ゲームルール</p>
      </header>

      <main className="welcome-main">
        <section className="welcome-description">
          <h2>📖 準備中</h2>
          <p>
            マニュアルページは現在準備中です。
          </p>
          <p>
            近日公開予定ですので、しばらくお待ちください。
          </p>
        </section>

        <section className="welcome-actions">
          <Link to="/" className="btn btn-primary">
            トップページに戻る
          </Link>
          <Link to="/game" className="btn btn-secondary">
            ゲームを開始する
          </Link>
        </section>
      </main>

      <footer className="welcome-footer">
        <p>&copy; 2026 SquFibo Game</p>
      </footer>
    </div>
  )
}
