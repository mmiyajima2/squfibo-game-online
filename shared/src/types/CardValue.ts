/**
 * カードの値
 *
 * SquFiboゲームで使用可能な4種類の数値
 */
export type CardValueType = 1 | 4 | 9 | 16;

/**
 * 有効なカード値の配列
 */
export const VALID_CARD_VALUES: readonly CardValueType[] = [1, 4, 9, 16] as const;

/**
 * カード値が有効かどうかを検証する
 */
export function isValidCardValue(value: number): value is CardValueType {
  return VALID_CARD_VALUES.includes(value as CardValueType);
}
