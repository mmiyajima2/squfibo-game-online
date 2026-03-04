import { Link } from 'react-router-dom'
import './StaticPage.css'

export function Sitemap() {
  return (
    <div className="static-container">
      <header className="static-header">
        <div className="static-header-inner">
          <Link to="/" className="static-back">← トップへ</Link>
          <h1>サイトマップ</h1>
        </div>
      </header>

      <main className="static-main">
        <section className="static-section">
          <div className="static-sitemap-group">
            <h3>メインコンテンツ</h3>
            <ul className="static-sitemap-list">
              <li><Link to="/">トップページ</Link></li>
              <li><Link to="/manual">ゲームのマニュアル</Link></li>
            </ul>
          </div>

          <div className="static-sitemap-group">
            <h3>サイト情報</h3>
            <ul className="static-sitemap-list">
              <li><Link to="/privacy">プライバシーポリシー</Link></li>
              <li><Link to="/terms">利用規約</Link></li>
              <li><Link to="/about">運営者情報</Link></li>
              <li><Link to="/sitemap">サイトマップ</Link></li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="static-footer">
        <p>&copy; 2026 SquFibo Game</p>
      </footer>
    </div>
  )
}
