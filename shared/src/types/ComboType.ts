/**
 * 役の種類
 *
 * すべての役は3枚のカードで構成される：
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
 * 役の報酬（星の数）を取得する
 */
export function getComboRewardStars(comboType: ComboType): number {
  return comboType === ComboType.THREE_CARDS ? 3 : 1;
}

/**
 * 役のドロー枚数を取得する
 */
export function getComboDrawCount(comboType: ComboType): number {
  return comboType === ComboType.THREE_CARDS ? 3 : 1;
}
