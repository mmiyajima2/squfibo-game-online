import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreateRoomDialog } from '../components/CreateRoomDialog'
import type { RoomCreatedPayload } from '../lib/socket'
import './Welcome.css'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'
const MAX_ROOMS = 89

export function Welcome() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [roomCount, setRoomCount] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchRoomCount = () => {
      fetch(`${SERVER_URL}/api/rooms/count`)
        .then(res => res.json())
        .then(data => setRoomCount(data.count))
        .catch(() => {})
    }
    fetchRoomCount()
    const interval = setInterval(fetchRoomCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  const handleRoomCreated = (data: RoomCreatedPayload, playerName: string) => {
    setIsDialogOpen(false)
    const params = new URLSearchParams({
      playerName,
      role: 'host',
      roomId: data.roomId,
      playerId: data.playerId,
    })
    navigate(`/game?${params.toString()}`)
  }

  return (
    <div className="welcome-container">
      <header className="welcome-header">
        <h1 className="welcome-title">SquFibo</h1>
        <p className="welcome-subtitle">すくふぃぼ</p>
      </header>

      <main className="welcome-main">

        {/* ゲーム紹介 */}
        <section className="welcome-section welcome-intro">
          <p className="welcome-tagline">
            「暗算力」ではなく、<strong>盤面全体を見渡して気づく力</strong>を育てる<br />
            小学生から楽しめる2人対戦カードゲームです。
          </p>
          <p className="welcome-description">
            3×3の盤面に数字カードを1枚ずつ置いていき、
            特定の組み合わせ（役）を作って星を集めます。
            知識量や計算速度よりも、盤面を一目で把握する「気づく力」が勝負のカギです。
          </p>
        </section>

        {/* ルール解説（簡易） */}
        <section className="welcome-section">
          <h2 className="section-title">ルール（かんたん解説）</h2>
          <ol className="rules-list">
            <li>3×3の盤面に交互に数字カードを1枚置く</li>
            <li>今置いたカードを含む「役」に気づいたら申告して星を獲得！</li>
            <li>
              <span className="role-label role-major">大役</span>
              同じ色のカード <code>1 + 4 + 16</code> → 星3個<br />
              <span className="role-label role-minor">小役</span>
              同じ色・同じ数字のカード3枚 → 星1個
            </li>
            <li className="rules-hint">
              <span className="hint-q">Q.</span> なぜ <code>1・4・16</code> という半端な組み合わせ？<br />
              <span className="hint-a">A.</span> この3つの数字には、ある美しい法則が隠れています。ゲームをしながら探してみてください！
            </li>
            <li>星が全部集まるか山札がなくなったらゲーム終了</li>
            <li>星が多いほうが勝ち！</li>
          </ol>
        </section>

        {/* 戦略の面白さ */}
        <section className="welcome-section">
          <h2 className="section-title">戦略の面白さ</h2>
          <p className="section-text">
            ルールはシンプルでも、盤面の読み合いが奥深い。
            どこにカードを置けば役が作れるか、どう相手の役を崩すか。
            盤面が満杯になると相手に「好きなカードを捨てる権利」を与えてしまいます。
            気づく速さと、盤面を相手にどう渡すかの駆け引きが生む、シンプルながら奥深いゲームです。
          </p>
        </section>

        {/* 開発背景 */}
        <section className="welcome-section">
          <h2 className="section-title">開発背景</h2>
          <p className="section-text">
            エンジニア歴20年目にして、初めて自分でサービスを作って公開しました。
            AIコーディングを駆使して約50時間で開発・公開まで達成。
            「暗算力ではなく気づく力を育てる」という教育的な価値を持つゲームを、
            無料で・広告のみで運営しています。
          </p>
        </section>

        {/* プレイはこちら */}
        <section className="welcome-actions">
          <h2 className="section-title">プレイはこちら</h2>
          <button onClick={handleOpenDialog} className="btn btn-primary btn-large">
            オンライン対戦版
          </button>
          {roomCount !== null && (
            <p className="room-count-info">
              現在 <span className="room-count-number">{roomCount}</span> / {MAX_ROOMS} 部屋が使用中
            </p>
          )}
          <p className="room-expiry-info">各部屋の時間制限は13分です</p>
          <a href="https://squfibo.buntozu.com/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-large">
            CPU対戦版
          </a>
        </section>

        <section className="welcome-links">
          <Link to="/manual" className="link-manual">
            📖 ゲームのマニュアルを見る
          </Link>
        </section>

      </main>

      <footer className="welcome-footer">
        <p>
          <a href="mailto:bunbnil@buntozu.com" className="contact-link">
            お問い合わせ: bunbnil@buntozu.com
          </a>
        </p>
        <nav className="footer-nav">
          <Link to="/privacy" className="footer-link">プライバシーポリシー</Link>
          <span className="footer-sep">|</span>
          <Link to="/terms" className="footer-link">利用規約</Link>
          <span className="footer-sep">|</span>
          <Link to="/about" className="footer-link">運営者情報</Link>
          <span className="footer-sep">|</span>
          <Link to="/sitemap" className="footer-link">サイトマップ</Link>
        </nav>
        <p>&copy; 2026 SquFibo Game</p>
      </footer>

      <CreateRoomDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSuccess={handleRoomCreated}
      />
    </div>
  )
}
