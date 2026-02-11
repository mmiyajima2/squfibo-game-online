import { Card } from '../entities/Card';
import type { Position } from 'squfibo-shared';

/**
 * 役の種類
 *
 * すべての役は3枚のカードで構成されます：
 * - THREE_CARDS（大役）: 1 + 4 + 16 = 21（フィボナッチ数）
 *   - 3枚除去 / 3枚ドロー / 星3個
 * - TRIPLE_MATCH（小役）: 同じ数字・同じ色の3枚
 *   - 3枚除去 / 1枚ドロー / 星1個
 */
export enum ComboType {
  THREE_CARDS = 'THREE_CARDS',
  TRIPLE_MATCH = 'TRIPLE_MATCH',
}

/**
 * 役（コンボ）を表すクラス
 *
 * 同色のカードの組み合わせで、すべて3枚のカードで構成されます。
 * - THREE_CARDS（大役）: 3枚除去 / 3枚ドロー / 星3個
 * - TRIPLE_MATCH（小役）: 3枚除去 / 1枚ドロー / 星1個
 */
export class Combo {
  constructor(
    public readonly type: ComboType,
    public readonly cards: Card[],
    public readonly positions: Position[]
  ) {
    if (cards.length !== positions.length) {
      throw new Error('Cards and positions arrays must have the same length');
    }
  }

  getRewardStars(): number {
    return this.type === ComboType.THREE_CARDS ? 3 : 1;
  }

  getDrawCount(): number {
    return this.type === ComboType.THREE_CARDS ? 3 : 1;
  }

  getCardCount(): number {
    return this.cards.length;
  }
}
