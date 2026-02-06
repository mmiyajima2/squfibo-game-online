/**
 * クライアント→サーバーのイベント型定義
 * Socket.IOでクライアントから送信されるイベントのペイロード型
 */

import type { PositionDTO } from '../dto/PositionDTO';

/**
 * ゲーム作成リクエスト
 */
export interface GameCreateRequest {
  /** プレイヤー名 */
  playerName: string;
}

/**
 * ゲーム参加リクエスト
 */
export interface GameJoinRequest {
  /** 参加するゲームID */
  gameId: string;

  /** プレイヤー名 */
  playerName: string;
}

/**
 * カード配置リクエスト
 */
export interface PlaceCardRequest {
  /** ゲームID */
  gameId: string;

  /** 配置する手札のインデックス（0または1） */
  handIndex: number;

  /** 配置する位置 */
  position: PositionDTO;
}

/**
 * 役の申告リクエスト
 */
export interface ClaimComboRequest {
  /** ゲームID */
  gameId: string;

  /** 申告する役の位置（3つ） */
  positions: [PositionDTO, PositionDTO, PositionDTO];
}

/**
 * ボードカード破棄リクエスト（ボード満杯時）
 */
export interface DiscardBoardCardRequest {
  /** ゲームID */
  gameId: string;

  /** 破棄するボード上のカードの位置 */
  position: PositionDTO;
}

/**
 * ターン終了リクエスト
 */
export interface EndTurnRequest {
  /** ゲームID */
  gameId: string;
}

/**
 * ゲーム退出リクエスト
 */
export interface LeaveGameRequest {
  /** ゲームID */
  gameId: string;
}

/**
 * すべてのクライアントイベントの型マップ
 */
export interface ClientEvents {
  'game:create': (data: GameCreateRequest, callback: (response: { success: boolean; gameId?: string; error?: string }) => void) => void;
  'game:join': (data: GameJoinRequest, callback: (response: { success: boolean; error?: string }) => void) => void;
  'game:place-card': (data: PlaceCardRequest, callback: (response: { success: boolean; error?: string }) => void) => void;
  'game:claim-combo': (data: ClaimComboRequest, callback: (response: { success: boolean; error?: string }) => void) => void;
  'game:discard-board-card': (data: DiscardBoardCardRequest, callback: (response: { success: boolean; error?: string }) => void) => void;
  'game:end-turn': (data: EndTurnRequest, callback: (response: { success: boolean; error?: string }) => void) => void;
  'game:leave': (data: LeaveGameRequest, callback: (response: { success: boolean; error?: string }) => void) => void;
}
