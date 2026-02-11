import { io, Socket } from 'socket.io-client';

// サーバーのURL（環境変数または開発用デフォルト）
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

// Socket.ioクライアントのシングルトンインスタンス
let socket: Socket | null = null;

/**
 * Socket.ioクライアントを初期化して取得
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false, // 手動接続
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000,
    });

    // 接続イベント
    socket.on('connect', () => {
      console.log('[Socket.io] Connected:', socket?.id);
    });

    // 切断イベント
    socket.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
    });

    // 接続エラーイベント
    socket.on('connect_error', (error) => {
      console.error('[Socket.io] Connection error:', error);
    });

    // 再接続試行イベント
    socket.on('reconnect_attempt', (attempt) => {
      console.log('[Socket.io] Reconnect attempt:', attempt);
    });

    // 再接続成功イベント
    socket.on('reconnect', (attempt) => {
      console.log('[Socket.io] Reconnected after', attempt, 'attempts');
    });

    // 再接続失敗イベント
    socket.on('reconnect_failed', () => {
      console.error('[Socket.io] Reconnection failed');
    });
  }

  return socket;
}

/**
 * Socket.ioに接続
 */
export function connectSocket(): void {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
}

/**
 * Socket.ioから切断
 */
export function disconnectSocket(): void {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

/**
 * Socket.ioの接続状態を確認
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

// イベントペイロードの型定義

export interface CreateRoomPayload {
  playerName: string;
}

export interface RoomCreatedPayload {
  roomId: string;
  hostUrl: string;
  guestUrl: string;
  playerId: string;
  expiresAt: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: any;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
}

export interface RoomJoinedPayload {
  roomId: string;
  playerId: string;
  playerName: string;
}

export interface ReadyPayload {
  roomId: string;
  playerId: string;
}

/**
 * 部屋を作成する
 */
export function createRoom(
  playerName: string,
  onSuccess: (data: RoomCreatedPayload) => void,
  onError: (error: ErrorPayload) => void
): void {
  const socket = getSocket();

  // 接続していない場合は接続
  if (!socket.connected) {
    connectSocket();
  }

  // roomCreatedイベントリスナーを登録（一度だけ実行）
  socket.once('roomCreated', (data: RoomCreatedPayload) => {
    console.log('[Socket.io] Room created:', data);
    onSuccess(data);
  });

  // errorイベントリスナーを登録（一度だけ実行）
  socket.once('error', (error: ErrorPayload) => {
    console.error('[Socket.io] Error creating room:', error);
    onError(error);
  });

  // createRoomイベントを送信
  const payload: CreateRoomPayload = { playerName };
  console.log('[Socket.io] Creating room with payload:', payload);
  socket.emit('createRoom', payload);
}

/**
 * 部屋に参加する
 */
export function joinRoom(
  roomId: string,
  playerName: string,
  onSuccess: (data: RoomJoinedPayload) => void,
  onError: (error: ErrorPayload) => void
): void {
  const socket = getSocket();

  // 接続していない場合は接続
  if (!socket.connected) {
    connectSocket();
  }

  // roomJoinedイベントリスナーを登録（一度だけ実行）
  socket.once('roomJoined', (data: RoomJoinedPayload) => {
    console.log('[Socket.io] Room joined:', data);
    onSuccess(data);
  });

  // errorイベントリスナーを登録（一度だけ実行）
  socket.once('error', (error: ErrorPayload) => {
    console.error('[Socket.io] Error joining room:', error);
    onError(error);
  });

  // joinRoomイベントを送信
  const payload: JoinRoomPayload = { roomId, playerName };
  console.log('[Socket.io] Joining room with payload:', payload);
  socket.emit('joinRoom', payload);
}

/**
 * 準備完了を送信する
 */
export function sendReady(
  roomId: string,
  playerId: string,
  onError?: (error: ErrorPayload) => void
): void {
  const socket = getSocket();

  // 接続していない場合は接続
  if (!socket.connected) {
    connectSocket();
  }

  if (onError) {
    // errorイベントリスナーを登録（一度だけ実行）
    socket.once('error', (error: ErrorPayload) => {
      console.error('[Socket.io] Error sending ready:', error);
      onError(error);
    });
  }

  // readyイベントを送信
  const payload: ReadyPayload = { roomId, playerId };
  console.log('[Socket.io] Sending ready with payload:', payload);
  socket.emit('ready', payload);
}
