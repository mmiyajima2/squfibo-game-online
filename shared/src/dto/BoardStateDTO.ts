import { CardDTO } from './CardDTO';

/**
 * 盤面の状態を表すDTO
 *
 * 3x3の盤面上に配置されたカード情報
 */
export interface BoardStateDTO {
  /**
   * 盤面のセル配列（3x3）
   *
   * cells[row][col] で各セルにアクセス
   * null の場合は空のセル
   */
  cells: (CardDTO | null)[][];
}
