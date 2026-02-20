import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { initializeSocketHandlers } from './socket/index.js';
import { initializeRedis, closeRedis } from './services/redisClient.js';
import { logger } from './utils/logger.js';

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
    logger.info('Redis initialized successfully');

    // HTTPサーバーを起動
    httpServer.listen(PORT, () => {
      logger.info({ port: PORT }, `Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();

// エラーハンドリング
process.on('unhandledRejection', (err) => {
  logger.fatal({ err }, 'Unhandled Promise Rejection');
  process.exit(1);
});

// グレースフルシャットダウン
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await closeRedis();
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await closeRedis();
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export { httpServer, io };
