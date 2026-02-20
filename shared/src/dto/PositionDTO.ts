/**
 * 位置情報のDTO
 *
 * 盤面上の位置を表すシンプルなデータ構造
 */
export interface PositionDTO {
  /** 行（0〜2） */
  row: number;
  /** 列（0〜2） */
  col: number;
}
