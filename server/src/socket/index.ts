import { Server, Socket } from 'socket.io';
import { RoomService } from '../services/RoomService.js';
import {
  CreateRoomPayload,
  RoomCreatedPayload,
  JoinRoomPayload,
  RoomJoinedPayload,
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

    // 部屋参加イベント
    socket.on('joinRoom', async (payload: JoinRoomPayload, callback) => {
      await handleJoinRoom(socket, payload, callback);
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

    // ホストを Socket.IO ルームに参加させる
    socket.join(result.roomId);

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

/**
 * joinRoomイベントハンドラー
 */
async function handleJoinRoom(
  socket: Socket,
  payload: JoinRoomPayload,
  callback?: (response: RoomJoinedPayload | ErrorPayload) => void
): Promise<void> {
  try {
    // バリデーション: roomId
    if (!payload.roomId || typeof payload.roomId !== 'string') {
      const error: ErrorPayload = {
        code: 'INVALID_ROOM_ID',
        message: '部屋IDが不正です',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // バリデーション: playerName
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

    // ゲストとして部屋に参加
    // 注: ホストはcreateRoom時に自動的に部屋に参加済み
    const result = await RoomService.joinRoom(
      payload.roomId,
      playerName,
      socket.id
    );

    console.log(`Player ${playerName} joined room ${payload.roomId} as guest`);

    // Socket.IOのルームに参加
    socket.join(payload.roomId);

    // レスポンスを送信
    const response: RoomJoinedPayload = {
      roomId: payload.roomId,
      playerId: result.playerId,
      role: 'guest',
      roomInfo: {
        hostPlayerName: result.roomInfo.hostPlayerName,
        guestPlayerName: result.roomInfo.guestPlayerName,
        status: result.roomInfo.status,
      },
    };

    callback?.(response);
    socket.emit('roomJoined', response);

    // 部屋の他のメンバー（ホスト）に通知
    socket.to(payload.roomId).emit('playerJoined', {
      playerId: result.playerId,
      playerName: playerName,
      role: 'guest',
    });
  } catch (error) {
    console.error('Error joining room:', error);

    let errorCode = 'SERVER_ERROR';
    let errorMessage = 'サーバーエラーが発生しました';

    if (error instanceof Error) {
      switch (error.message) {
        case 'ROOM_NOT_FOUND':
          errorCode = 'ROOM_NOT_FOUND';
          errorMessage = '部屋が見つかりません';
          break;
        case 'ROOM_FULL':
          errorCode = 'ROOM_FULL';
          errorMessage = 'この部屋は満室です';
          break;
        case 'ROOM_NOT_AVAILABLE':
          errorCode = 'ROOM_NOT_AVAILABLE';
          errorMessage = 'この部屋は参加できません';
          break;
        default:
          errorMessage = error.message;
      }
    }

    const errorPayload: ErrorPayload = {
      code: errorCode,
      message: errorMessage,
      details: error instanceof Error ? error.message : String(error),
    };

    callback?.(errorPayload);
    socket.emit('error', errorPayload);
  }
}
