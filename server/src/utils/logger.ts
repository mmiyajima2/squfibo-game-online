import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // 本番環境では JSON、開発環境では人間が読みやすい形式
  transport: isProduction ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  },

  // 構造化ログに含める基本情報
  base: {
    env: process.env.NODE_ENV || 'development'
  }
});
