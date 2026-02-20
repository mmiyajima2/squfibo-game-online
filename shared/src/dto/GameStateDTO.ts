import { GameState } from '../types/index.js';
import { BoardStateDTO } from './BoardStateDTO.js';
import { PlayerDTO } from './PlayerDTO.js';
import { PositionDTO } from './PositionDTO.js';

/**
 * ゲーム全体の状態を表すDTO
 *
 * クライアント・サーバー間でゲーム状態を同期するためのデータ構造
 */
export interface GameStateDTO {
  /** ゲームID */
  gameId: string;
  /** 盤面の状態 */
  board: BoardStateDTO;
  /** プレイヤー配列（2人） */
  players: [PlayerDTO, PlayerDTO];
  /** 現在のプレイヤーのインデックス（0 or 1） */
  currentPlayerIndex: 0 | 1;
  /** 山札に残っているカード枚数 */
  deckCount: number;
  /** 捨て札の枚数 */
  discardPileCount: number;
  /** 場に残っている星の数 */
  totalStars: number;
  /** ゲームの状態（PLAYING or FINISHED） */
  gameState: GameState;
  /** 最後に自動ドローが行われたプレイヤーID（null の場合は未実行） */
  lastAutoDrawnPlayerId: string | null;
  /** 最後に配置されたカードの位置（null の場合は未配置） */
  lastPlacedPosition: PositionDTO | null;
}
