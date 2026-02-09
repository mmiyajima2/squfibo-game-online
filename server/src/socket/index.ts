import { Server, Socket } from 'socket.io';
import { RoomService } from '../services/RoomService.js';
import { GameService } from '../services/GameService.js';
import {
  CreateRoomPayload,
  RoomCreatedPayload,
  JoinRoomPayload,
  RoomJoinedPayload,
  ReadyPayload,
  GameStartPayload,
  RemoveCardPayload,
  CardRemovedPayload,
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

    // 準備完了イベント
    socket.on('ready', async (payload: ReadyPayload, callback) => {
      await handleReady(io, socket, payload, callback);
    });

    // カード除去イベント（盤面満杯時）
    socket.on('removeCard', async (payload: RemoveCardPayload, callback) => {
      await handleRemoveCard(io, socket, payload, callback);
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

/**
 * readyイベントハンドラー
 */
async function handleReady(
  io: Server,
  socket: Socket,
  payload: ReadyPayload,
  callback?: (response: GameStartPayload | ErrorPayload) => void
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

    // 部屋の情報を取得
    const roomInfo = await RoomService.getRoomInfo(payload.roomId);

    if (!roomInfo) {
      const error: ErrorPayload = {
        code: 'ROOM_NOT_FOUND',
        message: '部屋が見つかりません',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // socket.idからplayerIdを特定
    let playerId: string | null = null;
    if (roomInfo.hostSocketId === socket.id) {
      playerId = roomInfo.hostPlayerId;
    } else if (roomInfo.guestSocketId === socket.id) {
      playerId = roomInfo.guestPlayerId;
    }

    if (!playerId) {
      const error: ErrorPayload = {
        code: 'NOT_IN_ROOM',
        message: 'プレイヤーが部屋に参加していません',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // プレイヤーを準備完了にする
    const result = await RoomService.markPlayerReady(payload.roomId, playerId);

    console.log(`Player ${playerId} is ready in room ${payload.roomId}`);

    // 両プレイヤーが準備完了した場合、ゲームを開始
    if (result.bothReady) {
      console.log(`Both players ready in room ${payload.roomId}, starting game...`);

      // ゲーム状態を初期化
      const gameState = GameService.createInitialGameState(
        payload.roomId,
        result.roomInfo.hostPlayerId,
        result.roomInfo.guestPlayerId!
      );

      // ゲーム状態をRedisに保存
      await GameService.saveGameState(payload.roomId, gameState);

      // 部屋のステータスをPLAYINGに更新
      await RoomService.setRoomPlaying(payload.roomId);

      // 各プレイヤーに個別のgameStartイベントを送信
      // ホストに送信
      const hostPayload: GameStartPayload = {
        gameState,
        yourPlayerId: result.roomInfo.hostPlayerId,
        yourPlayerIndex: gameState.players[0].id === result.roomInfo.hostPlayerId ? 0 : 1,
      };
      io.to(result.roomInfo.hostSocketId).emit('gameStart', hostPayload);

      // ゲストに送信
      const guestPayload: GameStartPayload = {
        gameState,
        yourPlayerId: result.roomInfo.guestPlayerId!,
        yourPlayerIndex: gameState.players[0].id === result.roomInfo.guestPlayerId ? 0 : 1,
      };
      io.to(result.roomInfo.guestSocketId!).emit('gameStart', guestPayload);

      // callbackにもレスポンスを返す（自分のpayload）
      const isHost = playerId === result.roomInfo.hostPlayerId;
      callback?.(isHost ? hostPayload : guestPayload);

      console.log(`Game started in room ${payload.roomId}`);
    }
  } catch (error) {
    console.error('Error handling ready event:', error);

    let errorCode = 'SERVER_ERROR';
    let errorMessage = 'サーバーエラーが発生しました';

    if (error instanceof Error) {
      switch (error.message) {
        case 'ROOM_NOT_FOUND':
          errorCode = 'ROOM_NOT_FOUND';
          errorMessage = '部屋が見つかりません';
          break;
        case 'NOT_IN_ROOM':
          errorCode = 'NOT_IN_ROOM';
          errorMessage = 'プレイヤーが部屋に参加していません';
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

/**
 * removeCardイベントハンドラー
 * 盤面が満杯の状態でターンを開始する際、1枚のカードを除去します
 */
async function handleRemoveCard(
  io: Server,
  socket: Socket,
  payload: RemoveCardPayload,
  callback?: (response: CardRemovedPayload | ErrorPayload) => void
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

    // バリデーション: position
    if (
      !payload.position ||
      typeof payload.position.row !== 'number' ||
      typeof payload.position.col !== 'number'
    ) {
      const error: ErrorPayload = {
        code: 'INVALID_POSITION',
        message: '位置情報が不正です',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // ゲーム状態を取得
    const gameState = await GameService.getGameState(payload.roomId);

    if (!gameState) {
      const error: ErrorPayload = {
        code: 'ROOM_NOT_FOUND',
        message: '部屋が見つかりません',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // 部屋情報を取得してプレイヤーを特定
    const roomInfo = await RoomService.getRoomInfo(payload.roomId);
    if (!roomInfo) {
      const error: ErrorPayload = {
        code: 'ROOM_NOT_FOUND',
        message: '部屋が見つかりません',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // socket.idからplayerIdを特定
    let playerId: string | null = null;
    if (roomInfo.hostSocketId === socket.id) {
      playerId = roomInfo.hostPlayerId;
    } else if (roomInfo.guestSocketId === socket.id) {
      playerId = roomInfo.guestPlayerId;
    }

    if (!playerId) {
      const error: ErrorPayload = {
        code: 'NOT_IN_ROOM',
        message: 'プレイヤーが部屋に参加していません',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // 現在のプレイヤーのインデックスを取得
    const currentPlayerIndex = gameState.players.findIndex((p: { id: string }) => p.id === playerId);

    // 自分のターンかどうかをチェック
    if (gameState.currentPlayerIndex !== currentPlayerIndex) {
      const error: ErrorPayload = {
        code: 'NOT_YOUR_TURN',
        message: '自分のターンではありません',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // 盤面が満杯かどうかをチェック
    if (!GameService.isBoardFull(gameState.board)) {
      const error: ErrorPayload = {
        code: 'BOARD_NOT_FULL',
        message: '盤面が満杯ではありません',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // 位置が有効かどうかをチェック
    const { row, col } = payload.position;
    if (!GameService.isValidPosition(row, col)) {
      const error: ErrorPayload = {
        code: 'INVALID_POSITION',
        message: '位置が盤面外です',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // 指定位置にカードがあるかチェック
    const card = GameService.getCardAt(gameState.board, row, col);
    if (!card) {
      const error: ErrorPayload = {
        code: 'NO_CARD_AT_POSITION',
        message: '指定位置にカードがありません',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // カードを除去
    const removedCard = GameService.removeCardFromBoard(gameState, row, col);

    if (!removedCard) {
      const error: ErrorPayload = {
        code: 'SERVER_ERROR',
        message: 'カードの除去に失敗しました',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // ゲーム状態を保存
    await GameService.saveGameState(payload.roomId, gameState);

    console.log(
      `Card removed at (${row}, ${col}) by player ${playerId} in room ${payload.roomId}`
    );

    // レスポンスを作成
    const response: CardRemovedPayload = {
      playerId,
      position: { row, col },
      card: {
        id: removedCard.id,
        value: removedCard.value,
        color: removedCard.color,
      },
    };

    // callbackでレスポンスを返す
    callback?.(response);

    // 部屋の全員にcardRemovedイベントを送信
    io.to(payload.roomId).emit('cardRemoved', response);

    // ゲーム状態更新イベントを送信
    io.to(payload.roomId).emit('gameStateUpdate', {
      gameState,
      updateType: 'card_removed',
    });
  } catch (error) {
    console.error('Error handling removeCard event:', error);

    const errorPayload: ErrorPayload = {
      code: 'SERVER_ERROR',
      message: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : String(error),
    };

    callback?.(errorPayload);
    socket.emit('error', errorPayload);
  }
}
