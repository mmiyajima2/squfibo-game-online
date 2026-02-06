import { CardDTO } from './CardDTO';

/**
 * 手札情報のDTO
 *
 * プレイヤーが保持しているカードのリスト
 */
export interface HandDTO {
  /** 手札のカード配列 */
  cards: CardDTO[];
}
