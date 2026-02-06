import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './app.js'
import { initializeSocketHandlers } from './socket/index.js'

const PORT = process.env.PORT || 3000
const httpServer = createServer(app)

// Socket.IOサーバーの初期化
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Socket.IOイベントハンドラーの初期化
initializeSocketHandlers(io)

// サーバー起動
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

// エラーハンドリング
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err)
  process.exit(1)
})

export { httpServer, io }
