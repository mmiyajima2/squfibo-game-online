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
  ClaimComboPayload,
  ComboResolvedPayload,
  EndTurnPayload,
  TurnEndedPayload,
  LeaveRoomPayload,
  PlayerLeftPayload,
  TurnChangedPayload,
  GameStateUpdatePayload,
  GameFinishedPayload,
  ErrorPayload,
} from './eventTypes.js';
import { logger } from '../utils/logger.js';
import { getComboRewardStars, getComboDrawCount, GameState } from '@squfibo/shared';

/**
 * Socket.IOイベントハンドラーを初期化
 */
export function initializeSocketHandlers(io: Server): void {
  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected');

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

    // 役申告イベント
    socket.on('claimCombo', async (payload: ClaimComboPayload, callback) => {
      await handleClaimCombo(io, socket, payload, callback);
    });

    // ターン終了イベント
    socket.on('endTurn', async (payload: EndTurnPayload, callback) => {
      await handleEndTurn(io, socket, payload, callback);
    });

    // 部屋退出イベント
    socket.on('leaveRoom', async (payload: LeaveRoomPayload, callback) => {
      await handleLeaveRoom(io, socket, payload, callback);
    });

    // 切断イベント
    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected');
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

    logger.info({ roomId: result.roomId, playerName, playerId: result.playerId }, 'Room created');

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
    logger.error({ err: error, socketId: socket.id }, 'Error creating room');

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

    logger.info({ roomId: payload.roomId, playerName, playerId: result.playerId, role: 'guest' }, 'Player joined room');

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
    logger.error({ err: error, roomId: payload.roomId, socketId: socket.id }, 'Error joining room');

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

    logger.info({ roomId: payload.roomId, playerId }, 'Player is ready');

    // 両プレイヤーが準備完了した場合、ゲームを開始
    if (result.bothReady) {
      logger.info({ roomId: payload.roomId }, 'Both players ready, starting game');

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

      logger.info({ roomId: payload.roomId, currentPlayerIndex: gameState.currentPlayerIndex }, 'Game started');
    }
  } catch (error) {
    logger.error({ err: error, roomId: payload.roomId, socketId: socket.id }, 'Error handling ready event');

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

    logger.info(
      { roomId: payload.roomId, playerId, position: { row, col }, cardId: removedCard.id },
      'Card removed from board'
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
    logger.error({ err: error, roomId: payload.roomId, socketId: socket.id }, 'Error handling removeCard event');

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
 * claimComboイベントハンドラー
 * カードを配置し、役の成立を申告します
 */
async function handleClaimCombo(
  io: Server,
  socket: Socket,
  payload: ClaimComboPayload,
  callback?: (response: ComboResolvedPayload | ErrorPayload) => void
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

    // バリデーション: comboPositions
    if (!Array.isArray(payload.comboPositions) || payload.comboPositions.length !== 3) {
      const error: ErrorPayload = {
        code: 'INVALID_COMBO_SIZE',
        message: '役の枚数が不正です（3枚である必要があります）',
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
    const currentPlayerIndex = gameState.players.findIndex((p) => p.id === playerId);
    const currentPlayer = gameState.players[currentPlayerIndex];

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

    // 指定位置が空いているかチェック
    if (GameService.getCardAt(gameState.board, row, col) !== null) {
      const error: ErrorPayload = {
        code: 'CELL_NOT_EMPTY',
        message: '指定位置が空いていません',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // 盤面が満杯かチェック（満杯の場合は先にカード除去が必要）
    if (GameService.isBoardFull(gameState.board)) {
      const error: ErrorPayload = {
        code: 'BOARD_FULL',
        message: '盤面が満杯です。先にカードを除去してください',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // カードの取得（手札から、または山札から自動ドロー）
    let cardToPlace;

    if (payload.cardId === null) {
      // 山札から自動ドロー
      if (currentPlayer.hand.cards.length > 0) {
        const error: ErrorPayload = {
          code: 'MUST_USE_HAND',
          message: '手札がある場合は山札からのドローはできません',
        };
        callback?.(error);
        socket.emit('error', error);
        return;
      }

      if (gameState.deckCount <= 0) {
        const error: ErrorPayload = {
          code: 'DECK_EMPTY',
          message: '山札が空です',
        };
        callback?.(error);
        socket.emit('error', error);
        return;
      }

      // 山札から1枚ドロー
      cardToPlace = GameService.drawSingleCardFromDeck();
      gameState.deckCount -= 1;
      gameState.lastAutoDrawnPlayerId = playerId;
    } else {
      // 手札から選択
      if (currentPlayer.hand.cards.length === 0) {
        const error: ErrorPayload = {
          code: 'MUST_DRAW_FROM_DECK',
          message: '手札が0枚の場合は山札からドローが必要です',
        };
        callback?.(error);
        socket.emit('error', error);
        return;
      }

      cardToPlace = GameService.removeCardFromHand(currentPlayer, payload.cardId);
      if (!cardToPlace) {
        const error: ErrorPayload = {
          code: 'CARD_NOT_IN_HAND',
          message: 'カードが手札に存在しません',
        };
        callback?.(error);
        socket.emit('error', error);
        return;
      }
    }

    // カードを盤面に配置
    const placed = GameService.placeCardOnBoard(gameState, cardToPlace, row, col);
    if (!placed) {
      const error: ErrorPayload = {
        code: 'SERVER_ERROR',
        message: 'カードの配置に失敗しました',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // 役の判定
    const combo = GameService.validateCombo(
      gameState.board,
      payload.comboPositions,
      { row, col }
    );

    if (!combo) {
      const error: ErrorPayload = {
        code: 'INVALID_COMBO',
        message: '役が成立していません',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // 役の解決
    const starsAwarded = Math.min(getComboRewardStars(combo.type), gameState.totalStars);
    const cardsToDrawCount = getComboDrawCount(combo.type);

    // カードを除去
    GameService.removeCardsFromBoard(gameState, combo.positions);

    // 星を獲得
    currentPlayer.stars += starsAwarded;
    gameState.totalStars -= starsAwarded;

    // カードをドロー
    const cardsDrawn = GameService.drawCardsFromDeck(gameState, currentPlayer, cardsToDrawCount);

    // ゲーム状態を保存
    await GameService.saveGameState(payload.roomId, gameState);

    logger.info(
      {
        roomId: payload.roomId,
        playerId,
        comboType: combo.type,
        starsAwarded,
        cardsDrawn,
      },
      'Combo resolved'
    );

    // レスポンスを作成
    const response: ComboResolvedPayload = {
      playerId,
      combo,
      starsAwarded,
      cardsDrawn,
    };

    // callbackでレスポンスを返す
    callback?.(response);

    // 部屋の全員にcomboResolvedイベントを送信
    io.to(payload.roomId).emit('comboResolved', response);

    // ゲーム状態更新イベントを送信
    const updatePayload: GameStateUpdatePayload = {
      gameState,
      updateType: 'combo_resolved',
    };
    io.to(payload.roomId).emit('gameStateUpdate', updatePayload);

    // ゲーム終了判定
    const endReason = GameService.checkGameEnd(gameState);

    if (endReason) {
      // ゲーム終了
      gameState.gameState = GameState.FINISHED;
      await GameService.saveGameState(payload.roomId, gameState);

      const winnerIndex = GameService.determineWinner(gameState);
      const winner =
        winnerIndex !== null
          ? {
              playerId: gameState.players[winnerIndex].id,
              playerName:
                winnerIndex === 0 ? roomInfo.hostPlayerName : roomInfo.guestPlayerName!,
              stars: gameState.players[winnerIndex].stars,
            }
          : null;

      const finishedPayload: GameFinishedPayload = {
        gameState,
        winner,
        isDraw: winnerIndex === null,
        reason: endReason,
      };

      io.to(payload.roomId).emit('gameFinished', finishedPayload);

      logger.info(
        { roomId: payload.roomId, winner: winner?.playerId, reason: endReason },
        'Game finished'
      );
    } else {
      // ターン変更
      GameService.changeTurn(gameState);
      await GameService.saveGameState(payload.roomId, gameState);

      const turnPayload: TurnChangedPayload = {
        currentPlayerIndex: gameState.currentPlayerIndex,
        currentPlayerId: gameState.players[gameState.currentPlayerIndex].id,
      };

      io.to(payload.roomId).emit('turnChanged', turnPayload);

      logger.info(
        { roomId: payload.roomId, currentPlayerIndex: gameState.currentPlayerIndex },
        'Turn changed'
      );
    }
  } catch (error) {
    logger.error(
      { err: error, roomId: payload.roomId, socketId: socket.id },
      'Error handling claimCombo event'
    );

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
 * endTurnイベントハンドラー
 * カードを配置し、役を申告せずにターンを終了します
 */
async function handleEndTurn(
  io: Server,
  socket: Socket,
  payload: EndTurnPayload,
  callback?: (response: TurnEndedPayload | ErrorPayload) => void
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
    const currentPlayerIndex = gameState.players.findIndex((p) => p.id === playerId);
    const currentPlayer = gameState.players[currentPlayerIndex];

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

    // 指定位置が空いているかチェック
    if (GameService.getCardAt(gameState.board, row, col) !== null) {
      const error: ErrorPayload = {
        code: 'CELL_NOT_EMPTY',
        message: '指定位置が空いていません',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // 盤面が満杯かチェック（満杯の場合は先にカード除去が必要）
    if (GameService.isBoardFull(gameState.board)) {
      const error: ErrorPayload = {
        code: 'BOARD_FULL',
        message: '盤面が満杯です。先にカードを除去してください',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // カードの取得（手札から、または山札から自動ドロー）
    let cardToPlace;

    if (payload.cardId === null) {
      // 山札から自動ドロー
      if (currentPlayer.hand.cards.length > 0) {
        const error: ErrorPayload = {
          code: 'MUST_USE_HAND',
          message: '手札がある場合は山札からのドローはできません',
        };
        callback?.(error);
        socket.emit('error', error);
        return;
      }

      if (gameState.deckCount <= 0) {
        const error: ErrorPayload = {
          code: 'DECK_EMPTY',
          message: '山札が空です',
        };
        callback?.(error);
        socket.emit('error', error);
        return;
      }

      // 山札から1枚ドロー
      cardToPlace = GameService.drawSingleCardFromDeck();
      gameState.deckCount -= 1;
      gameState.lastAutoDrawnPlayerId = playerId;
    } else {
      // 手札から選択
      if (currentPlayer.hand.cards.length === 0) {
        const error: ErrorPayload = {
          code: 'MUST_DRAW_FROM_DECK',
          message: '手札が0枚の場合は山札からドローが必要です',
        };
        callback?.(error);
        socket.emit('error', error);
        return;
      }

      cardToPlace = GameService.removeCardFromHand(currentPlayer, payload.cardId);
      if (!cardToPlace) {
        const error: ErrorPayload = {
          code: 'CARD_NOT_IN_HAND',
          message: 'カードが手札に存在しません',
        };
        callback?.(error);
        socket.emit('error', error);
        return;
      }
    }

    // カードを盤面に配置
    const placed = GameService.placeCardOnBoard(gameState, cardToPlace, row, col);
    if (!placed) {
      const error: ErrorPayload = {
        code: 'SERVER_ERROR',
        message: 'カードの配置に失敗しました',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    // ゲーム状態を保存
    await GameService.saveGameState(payload.roomId, gameState);

    logger.info(
      {
        roomId: payload.roomId,
        playerId,
        position: { row, col },
        cardId: cardToPlace.id,
      },
      'Turn ended'
    );

    // レスポンスを作成
    const response: TurnEndedPayload = {
      playerId,
      placedCard: cardToPlace,
      position: { row, col },
    };

    // callbackでレスポンスを返す
    callback?.(response);

    // 部屋の全員にturnEndedイベントを送信
    io.to(payload.roomId).emit('turnEnded', response);

    // ゲーム状態更新イベントを送信
    const updatePayload: GameStateUpdatePayload = {
      gameState,
      updateType: 'card_placed',
    };
    io.to(payload.roomId).emit('gameStateUpdate', updatePayload);

    // ターン変更
    GameService.changeTurn(gameState);
    await GameService.saveGameState(payload.roomId, gameState);

    const turnPayload: TurnChangedPayload = {
      currentPlayerIndex: gameState.currentPlayerIndex,
      currentPlayerId: gameState.players[gameState.currentPlayerIndex].id,
    };

    io.to(payload.roomId).emit('turnChanged', turnPayload);

    logger.info(
      { roomId: payload.roomId, currentPlayerIndex: gameState.currentPlayerIndex },
      'Turn changed'
    );
  } catch (error) {
    logger.error(
      { err: error, roomId: payload.roomId, socketId: socket.id },
      'Error handling endTurn event'
    );

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
 * leaveRoomイベントハンドラー
 * 対戦部屋から退出します
 */
async function handleLeaveRoom(
  io: Server,
  socket: Socket,
  payload: LeaveRoomPayload,
  callback?: (response: { success: boolean } | ErrorPayload) => void
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

    // 部屋情報を取得
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

    // socket.idからplayerIdとプレイヤー名を特定
    let playerId: string | null = null;
    let playerName: string | null = null;

    if (roomInfo.hostSocketId === socket.id) {
      playerId = roomInfo.hostPlayerId;
      playerName = roomInfo.hostPlayerName;
    } else if (roomInfo.guestSocketId === socket.id) {
      playerId = roomInfo.guestPlayerId;
      playerName = roomInfo.guestPlayerName;
    }

    if (!playerId || !playerName) {
      const error: ErrorPayload = {
        code: 'NOT_IN_ROOM',
        message: 'プレイヤーが部屋に参加していません',
      };
      callback?.(error);
      socket.emit('error', error);
      return;
    }

    logger.info({ roomId: payload.roomId, playerId, playerName }, 'Player leaving room');

    // Socket.IOルームから退出
    socket.leave(payload.roomId);

    // 部屋の他のメンバーに通知
    const leftPayload: PlayerLeftPayload = {
      playerId,
      playerName,
    };

    socket.to(payload.roomId).emit('playerLeft', leftPayload);

    // callbackでレスポンスを返す
    callback?.({ success: true });

    logger.info({ roomId: payload.roomId, playerId, playerName }, 'Player left room');
  } catch (error) {
    logger.error(
      { err: error, roomId: payload.roomId, socketId: socket.id },
      'Error handling leaveRoom event'
    );

    const errorPayload: ErrorPayload = {
      code: 'SERVER_ERROR',
      message: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : String(error),
    };

    callback?.(errorPayload);
    socket.emit('error', errorPayload);
  }
}
