import { Link } from 'react-router-dom'
import './StaticPage.css'

export function Terms() {
  return (
    <div className="static-container">
      <header className="static-header">
        <div className="static-header-inner">
          <Link to="/" className="static-back">← トップへ</Link>
          <h1>利用規約</h1>
        </div>
      </header>

      <main className="static-main">
        <section className="static-section">
          <p>
            本利用規約は、SquFibo（すくふぃぼ）（以下「本サービス」）のご利用条件を定めたものです。
            本サービスをご利用になる場合は、本規約に同意したものとみなします。
          </p>
        </section>

        <section className="static-section">
          <h2>サービス概要</h2>
          <p>
            本サービスは、2人対戦カードゲーム「SquFibo（すくふぃぼ）」を楽しめる無料サービスです。
            オンライン対戦版（本サイト）のほか、CPU対戦版（<a href="https://squfibo.buntozu.com/" target="_blank" rel="noopener noreferrer" className="static-contact">squfibo.buntozu.com</a>）もご利用いただけます。
            いずれも利用にあたりアカウント登録は不要です。
          </p>
        </section>

        <section className="static-section">
          <h2>禁止事項</h2>
          <p>以下の行為を禁止します。</p>
          <ul>
            <li>サーバーへの過度なアクセス・自動化ツールによる操作</li>
            <li>チート行為・不正な手段によるゲームの操作</li>
            <li>他のユーザーへの迷惑行為・嫌がらせ</li>
            <li>本サービスのリバースエンジニアリング・改ざん</li>
            <li>法令または公序良俗に反する行為</li>
          </ul>
        </section>

        <section className="static-section">
          <h2>免責事項</h2>
          <p>
            本サービスは「現状有姿」で提供されます。
            システム障害・メンテナンス・予告なき変更・終了による損害について、
            運営者は一切の責任を負いません。
          </p>
        </section>

        <section className="static-section">
          <h2>著作権</h2>
          <p>
            本サービスに掲載されているコンテンツ（ゲームシステム・デザイン・テキスト等）の
            著作権は運営者に帰属します。
          </p>
        </section>

        <section className="static-section">
          <h2>規約の変更</h2>
          <p>
            本規約は予告なく変更されることがあります。
            変更後も本サービスの利用を継続した場合、変更後の規約に同意したものとみなします。
          </p>
        </section>

        <section className="static-section">
          <h2>お問い合わせ</h2>
          <p>
            利用規約に関するお問い合わせは、下記メールアドレスまでご連絡ください。<br />
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
