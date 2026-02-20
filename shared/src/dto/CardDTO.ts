import { CardColor, CardValueType } from '../types/index.js';

/**
 * カード情報のDTO
 *
 * クライアント・サーバー間でカード情報を転送するためのデータ構造
 */
export interface CardDTO {
  /** カードの一意識別子 */
  id: string;
  /** カードの値（1, 4, 9, 16） */
  value: CardValueType;
  /** カードの色（RED, BLUE） */
  color: CardColor;
}
