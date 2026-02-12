import { io, Socket } from 'socket.io-client';

// サーバーのURL（環境変数または開発用デフォルト）
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

// Socket.ioクライアントのシングルトンインスタンス
let socketInstance: Socket | null = null;

/**
 * Socket.ioクライアントを初期化して取得
 */
export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SERVER_URL, {
      autoConnect: false, // 手動接続
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000,
    });

    // 接続イベント
    socketInstance.on('connect', () => {
      console.log('[Socket.io] Connected:', socketInstance?.id);
    });

    // 切断イベント
    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
    });

    // 接続エラーイベント
    socketInstance.on('connect_error', (error) => {
      console.error('[Socket.io] Connection error:', error);
    });

    // 再接続試行イベント
    socketInstance.on('reconnect_attempt', (attempt) => {
      console.log('[Socket.io] Reconnect attempt:', attempt);
    });

    // 再接続成功イベント
    socketInstance.on('reconnect', (attempt) => {
      console.log('[Socket.io] Reconnected after', attempt, 'attempts');
    });

    // 再接続失敗イベント
    socketInstance.on('reconnect_failed', () => {
      console.error('[Socket.io] Reconnection failed');
    });
  }

  return socketInstance;
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
  if (socketInstance && socketInstance.connected) {
    socketInstance.disconnect();
  }
}

/**
 * Socket.ioの接続状態を確認
 */
export function isSocketConnected(): boolean {
  return socketInstance?.connected ?? false;
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

// グローバルにアクセス可能なsocketインスタンス（遅延初期化）
export const socket = getSocket();
