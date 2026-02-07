import { Server, Socket } from 'socket.io';
import { RoomService } from '../services/RoomService.js';
import {
  CreateRoomPayload,
  RoomCreatedPayload,
  ErrorPayload,
} from './eventTypes.js';

/**
 * Socket.IOイベントハンドラーを初期化
 */
export function initializeSocketHandlers(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // 部屋作成イベント
    socket.on('createRoom', async (payload: CreateRoomPayload, callback) => {
      await handleCreateRoom(socket, payload, callback);
    });

    // 切断イベント
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // TODO: 部屋からの退出処理を追加
    });
  });
}

/**
 * createRoomイベントハンドラー
 */
async function handleCreateRoom(
  socket: Socket,
  payload: CreateRoomPayload,
  callback?: (response: RoomCreatedPayload | ErrorPayload) => void
): Promise<void> {
  try {
    // バリデーション
    if (!payload.playerName || typeof payload.playerName !== 'string') {
      const error: ErrorPayload = {
        code: 'INVALID_PLAYER_NAME',
        message: 'プレイヤー名が不正です',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    const playerName = payload.playerName.trim();
    if (playerName.length < 1 || playerName.length > 20) {
      const error: ErrorPayload = {
        code: 'INVALID_PLAYER_NAME',
        message: 'プレイヤー名は1〜20文字である必要があります',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // ベースURLを生成（環境変数から取得、デフォルトはlocalhost）
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // 部屋を作成
    const result = await RoomService.createRoom(playerName, socket.id, baseUrl);

    console.log(`Room created: ${result.roomId} by ${playerName}`);

    // レスポンスを送信
    const response: RoomCreatedPayload = {
      roomId: result.roomId,
      hostUrl: result.hostUrl,
      guestUrl: result.guestUrl,
      playerId: result.playerId,
      expiresAt: result.expiresAt,
    };

    callback?.(response);
    socket.emit('roomCreated', response);
  } catch (error) {
    console.error('Error creating room:', error);

    const errorPayload: ErrorPayload = {
      code: 'SERVER_ERROR',
      message: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : String(error),
    };

    callback?.(errorPayload);
    socket.emit('error', errorPayload);
  }
}
