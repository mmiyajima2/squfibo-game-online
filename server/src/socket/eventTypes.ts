/**
 * Socket.IOイベントの型定義
 */

import type { GameStateDTO, ComboDTO, CardDTO, PositionDTO } from '@squfibo/shared';

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
  playerId: string;
}

export interface RemoveCardPayload {
  roomId: string;
  playerId: string;
  position: { row: number; col: number };
}

export interface ClaimComboPayload {
  roomId: string;
  playerId: string;
  cardId: string | null;
  position: { row: number; col: number };
  comboPositions: Array<{ row: number; col: number }>;
}

export interface EndTurnPayload {
  roomId: string;
  playerId: string;
  cardId: string | null;
  position: { row: number; col: number };
}

export interface LeaveRoomPayload {
  roomId: string;
  playerId: string;
}

// サーバー → クライアント

export interface RoomCreatedPayload {
  roomId: string;
  hostUrl: string;
  guestUrl: string;
  playerId: string;
  expiresAt: string;
}

export interface RoomJoinedPayload {
  roomId: string;
  playerId: string;
  role: 'host' | 'guest';
  roomInfo: {
    hostPlayerName: string;
    guestPlayerName: string | null;
    status: string;
  };
}

export interface GameStartPayload {
  gameState: GameStateDTO;
  yourPlayerId: string;
  yourPlayerIndex: 0 | 1;
}

export interface CardRemovedPayload {
  playerId: string;
  position: { row: number; col: number };
  card: {
    id: string;
    value: number;
    color: string;
  };
}

export interface ComboResolvedPayload {
  playerId: string;
  combo: ComboDTO;
  starsAwarded: number;
  cardsDrawn: number;
}

export interface TurnEndedPayload {
  playerId: string;
  placedCard: CardDTO;
  position: PositionDTO;
}

export interface TurnChangedPayload {
  currentPlayerIndex: 0 | 1;
  currentPlayerId: string;
}

export interface GameStateUpdatePayload {
  gameState: GameStateDTO;
  updateType: 'card_placed' | 'card_removed' | 'combo_resolved' | 'turn_changed';
}

export interface GameFinishedPayload {
  gameState: GameStateDTO;
  winner: {
    playerId: string;
    playerName: string;
    stars: number;
  } | null;
  isDraw: boolean;
  reason: 'ALL_STARS_CLAIMED' | 'DECK_EMPTY';
}

export interface PlayerLeftPayload {
  playerId: string;
  playerName: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}
