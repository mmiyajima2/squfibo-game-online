import { Link } from 'react-router-dom'
import './StaticPage.css'

export function About() {
  return (
    <div className="static-container">
      <header className="static-header">
        <div className="static-header-inner">
          <Link to="/" className="static-back">← トップへ</Link>
          <h1>運営者情報</h1>
        </div>
      </header>

      <main className="static-main">
        <section className="static-section">
          <table className="static-info-table">
            <tbody>
              <tr>
                <th>サービス名</th>
                <td>SquFibo（すくふぃぼ）</td>
              </tr>
              <tr>
                <th>運営者</th>
                <td>buntozu</td>
              </tr>
              <tr>
                <th>開設</th>
                <td>2026年</td>
              </tr>
              <tr>
                <th>お問い合わせ</th>
                <td>
                  <a href="mailto:bunbinil@buntozu.com" className="static-contact">
                    bunbinil@buntozu.com
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>

      <footer className="static-footer">
        <p>&copy; 2026 SquFibo Game</p>
      </footer>
    </div>
  )
}
