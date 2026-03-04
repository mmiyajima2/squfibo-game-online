import { Link } from 'react-router-dom'
import './StaticPage.css'

export function Privacy() {
  return (
    <div className="static-container">
      <header className="static-header">
        <div className="static-header-inner">
          <Link to="/" className="static-back">← トップへ</Link>
          <h1>プライバシーポリシー</h1>
        </div>
      </header>

      <main className="static-main">
        <section className="static-section">
          <p>
            本プライバシーポリシーは、SquFibo（すくふぃぼ）（以下「本サービス」）における
            個人情報の取り扱いについて定めたものです。
          </p>
        </section>

        <section className="static-section">
          <h2>収集する情報</h2>
          <p>
            本サービスでは、利用状況の把握・改善を目的として、Google Analytics による
            アクセス解析を行っています。収集されるデータ（IPアドレス等）は匿名化されており、
            個人を特定することはできません。
          </p>
          <p>
            本サービスへのアクセス・ゲームのプレイにあたり、アカウント登録や個人情報の入力は必要ありません。
          </p>
        </section>

        <section className="static-section">
          <h2>Cookieについて</h2>
          <p>
            本サービスでは Google Analytics の機能を利用するため、Cookie（クッキー）を使用しています。
            Cookie は、より良いユーザー体験の提供を目的としており、個人情報の収集には使用しておりません。
            ブラウザの設定により Cookie を無効化することができますが、一部の機能が制限される場合があります。
          </p>
        </section>

        <section className="static-section">
          <h2>第三者への情報提供</h2>
          <p>
            取得した情報は、法令に基づく場合を除き、第三者に提供することはありません。
          </p>
        </section>

        <section className="static-section">
          <h2>本ポリシーの変更</h2>
          <p>
            本ポリシーは、必要に応じて変更されることがあります。
            重要な変更は本ページにてお知らせします。
          </p>
        </section>

        <section className="static-section">
          <h2>お問い合わせ</h2>
          <p>
            プライバシーポリシーに関するお問い合わせは、下記メールアドレスまでご連絡ください。<br />
            <a href="mailto:bunbinil@buntozu.com" className="static-contact">bunbinil@buntozu.com</a>
          </p>
        </section>
      </main>

      <footer className="static-footer">
        <p>&copy; 2026 SquFibo Game</p>
      </footer>
    </div>
  )
}
