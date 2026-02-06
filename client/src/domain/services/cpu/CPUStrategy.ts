import { Card } from '../../entities/Card';
import { Position } from '../../valueObjects/Position';
import { Combo } from '../Combo';
import type { Game } from '../../Game';

/**
 * CPU戦略の結果を表すインターフェース
 */
export interface CPUTurnResult {
  placedCard: Card;
  position: Position;
  removedPosition?: Position; // 盤面満杯時に除去した位置
  claimedCombo: Combo | null;
  missedCombo: Combo | null; // 見落とした役（デバッグ用）
}

/**
 * CPUアクションのステップ型定義
 */
export type CPUActionStep =
  | { type: 'REMOVE_CARD'; position: Position }
  | { type: 'PLACE_CARD'; card: Card; position: Position; isFromDeck: boolean }
  | { type: 'CLAIM_COMBO'; combo: Combo }
  | { type: 'END_TURN' };

/**
 * CPUターンの実行計画（全ての意思決定を含む）
 */
export interface CPUTurnPlan {
  steps: CPUActionStep[];
  missedCombo?: Combo | null;
}

/**
 * CPU戦略の抽象インターフェース
 *
 * 各難易度の戦略は、このインターフェースを実装する。
 * 拡張性を考慮し、将来的にNormal, Hard難易度を追加できるように設計。
 */
export interface CPUStrategy {
  /**
   * CPUの1ターンを実行する
   *
   * @param game 現在のゲーム状態
   * @returns ターン実行結果
   */
  executeTurn(game: Game): CPUTurnResult;

  /**
   * CPUの1ターンを計画する（状態変更なし）
   *
   * @param game 現在のゲーム状態
   * @returns ターン実行計画
   */
  planTurn(game: Game): CPUTurnPlan;
}
