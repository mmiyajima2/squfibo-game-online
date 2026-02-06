import { Server } from 'socket.io'

export function initializeSocketHandlers(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })

    // TODO: ゲーム関連のイベントハンドラーを追加
  })
}
