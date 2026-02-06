import express from 'express'
import cors from 'cors'

const app = express()

// ミドルウェア
app.use(cors())
app.use(express.json())

// ヘルスチェックエンドポイント
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 基本ルート
app.get('/', (_req, res) => {
  res.json({ message: 'SquFibo Game Server' })
})

export default app
