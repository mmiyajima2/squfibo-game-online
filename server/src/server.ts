import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { initializeSocketHandlers } from './socket/index.js';
import { initializeRedis, closeRedis } from './services/redisClient.js';

const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);

// Socket.IOサーバーの初期化
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Socket.IOイベントハンドラーの初期化
initializeSocketHandlers(io);

// サーバー起動
async function startServer() {
  try {
    // Redisクライアントを初期化
    await initializeRedis();
    console.log('Redis initialized successfully');

    // HTTPサーバーを起動
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// エラーハンドリング
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// グレースフルシャットダウン
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await closeRedis();
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await closeRedis();
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export { httpServer, io };
