/**
 * 盤面上の位置を表す型
 *
 * 3x3の盤面における行(row)と列(col)の位置
 * 両方とも0〜2の範囲
 */
export interface Position {
  row: number;
  col: number;
}

/**
 * 位置が有効な範囲内かどうかを検証する
 */
export function isValidPosition(position: Position): boolean {
  return (
    position.row >= 0 &&
    position.row <= 2 &&
    position.col >= 0 &&
    position.col <= 2
  );
}

/**
 * 2つの位置が同じかどうかを比較する
 */
export function positionEquals(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}
