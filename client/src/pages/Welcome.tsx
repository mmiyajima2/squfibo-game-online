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
    // ダイアログを閉じる
    setIsDialogOpen(false)

    // /gameページに遷移（query parameterでplayerName, role, roomId, playerIdを渡す）
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
        <p className="welcome-tagline">数字と色のカードで役を作り、星をたくさん集めたほうが勝ち！<br />小学生から楽しめる2人対戦ボードゲームです。</p>

        <section className="welcome-actions">
          <button onClick={handleOpenDialog} className="btn btn-primary btn-large">
            オンライン版を開始する
          </button>
          {roomCount !== null && (
            <p className="room-count-info">
              現在 <span className="room-count-number">{roomCount}</span> / {MAX_ROOMS} 部屋が使用中
            </p>
          )}
          <a href="https://squfibo.buntozu.com/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-large">
            ブラウザ版で遊ぶ
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
