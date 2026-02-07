/**
 * Socket.IOイベントの型定義
 */

// クライアント → サーバー

export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
}

export interface ReadyPayload {
  roomId: string;
}

export interface RemoveCardPayload {
  roomId: string;
  position: { row: number; col: number };
}

export interface ClaimComboPayload {
  roomId: string;
  cardId: string | null;
  position: { row: number; col: number };
  comboPositions: Array<{ row: number; col: number }>;
}

export interface EndTurnPayload {
  roomId: string;
  cardId: string | null;
  position: { row: number; col: number };
}

export interface LeaveRoomPayload {
  roomId: string;
}

// サーバー → クライアント

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
  details?: unknown;
}
