import express from 'express'
import cors from 'cors'
import { RoomService } from './services/RoomService.js'

const app = express()

// ミドルウェア
app.use(cors())
app.use(express.json())

// ヘルスチェックエンドポイント
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 部屋数取得エンドポイント
app.get('/api/rooms/count', async (_req, res) => {
  const count = await RoomService.getRoomCount()
  res.json({ count, max: 89 })
})

// 基本ルート
app.get('/', (_req, res) => {
  res.json({ message: 'SquFibo Game Server' })
})

export default app
