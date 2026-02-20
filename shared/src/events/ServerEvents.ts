/**
 * サーバー→クライアントのイベント型定義
 * Socket.IOでサーバーから送信されるイベントのペイロード型
 */

import type { GameStateDTO } from '../dto/GameStateDTO.js';
import type { ComboDTO } from '../dto/ComboDTO.js';
import type { PositionDTO } from '../dto/PositionDTO.js';

/**
 * ゲーム作成成功イベント
 */
export interface GameCreatedEvent {
  /** 作成されたゲームID */
  gameId: string;

  /** 作成者のプレイヤーID */
  playerId: string;

  /** 初期ゲーム状態 */
  gameState: GameStateDTO;
}

/**
 * ゲーム参加成功イベント
 */
export interface GameJoinedEvent {
  /** 参加したゲームID */
  gameId: string;

  /** 参加したプレイヤーID */
  playerId: string;

  /** 現在のゲーム状態 */
  gameState: GameStateDTO;
}

/**
 * ゲーム状態更新イベント（全員に配信）
 */
export interface GameStateUpdateEvent {
  /** ゲームID */
  gameId: string;

  /** 更新されたゲーム状態 */
  gameState: GameStateDTO;

  /** 更新理由（オプション） */
  reason?: 'card-placed' | 'combo-claimed' | 'turn-ended' | 'player-joined' | 'player-left' | 'game-finished';
}

/**
 * カード配置成功イベント
 */
export interface CardPlacedEvent {
  /** ゲームID */
  gameId: string;

  /** カードを配置したプレイヤーID */
  playerId: string;

  /** 配置した位置 */
  position: PositionDTO;

  /** 更新されたゲーム状態 */
  gameState: GameStateDTO;
}

/**
 * 役の申告成功イベント
 */
export interface ComboClaimedEvent {
  /** ゲームID */
  gameId: string;

  /** 役を申告したプレイヤーID */
  playerId: string;

  /** 申告された役 */
  combo: ComboDTO;

  /** 更新されたゲーム状態 */
  gameState: GameStateDTO;
}

/**
 * ボードカード破棄成功イベント
 */
export interface BoardCardDiscardedEvent {
  /** ゲームID */
  gameId: string;

  /** カードを破棄したプレイヤーID */
  playerId: string;

  /** 破棄されたカードの位置 */
  position: PositionDTO;

  /** 更新されたゲーム状態 */
  gameState: GameStateDTO;
}

/**
 * ターン終了イベント
 */
export interface TurnEndedEvent {
  /** ゲームID */
  gameId: string;

  /** 次のプレイヤーID */
  nextPlayerId: string;

  /** 更新されたゲーム状態 */
  gameState: GameStateDTO;
}

/**
 * ゲーム終了イベント
 */
export interface GameFinishedEvent {
  /** ゲームID */
  gameId: string;

  /** 勝者のプレイヤーID */
  winnerId: string;

  /** 最終ゲーム状態 */
  gameState: GameStateDTO;
}

/**
 * プレイヤー参加通知イベント
 */
export interface PlayerJoinedEvent {
  /** ゲームID */
  gameId: string;

  /** 参加したプレイヤーID */
  playerId: string;

  /** プレイヤー名 */
  playerName: string;
}

/**
 * プレイヤー退出通知イベント
 */
export interface PlayerLeftEvent {
  /** ゲームID */
  gameId: string;

  /** 退出したプレイヤーID */
  playerId: string;

  /** ゲームが終了したかどうか */
  gameEnded: boolean;
}

/**
 * エラー通知イベント
 */
export interface GameErrorEvent {
  /** エラーコード */
  code: string;

  /** エラーメッセージ */
  message: string;

  /** エラー詳細（オプション） */
  details?: unknown;
}

/**
 * すべてのサーバーイベントの型マップ
 */
export interface ServerEvents {
  'game:created': (data: GameCreatedEvent) => void;
  'game:joined': (data: GameJoinedEvent) => void;
  'game:state-update': (data: GameStateUpdateEvent) => void;
  'card:placed': (data: CardPlacedEvent) => void;
  'combo:claimed': (data: ComboClaimedEvent) => void;
  'board-card:discarded': (data: BoardCardDiscardedEvent) => void;
  'turn:ended': (data: TurnEndedEvent) => void;
  'game:finished': (data: GameFinishedEvent) => void;
  'player:joined': (data: PlayerJoinedEvent) => void;
  'player:left': (data: PlayerLeftEvent) => void;
  'game:error': (data: GameErrorEvent) => void;
}
