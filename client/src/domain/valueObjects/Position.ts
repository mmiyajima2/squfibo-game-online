export class Position {
  private constructor(
    private readonly _row: number,
    private readonly _col: number
  ) {
    if (_row < 0 || _row > 2) {
      throw new Error(`Invalid row: ${_row}. Must be between 0 and 2`);
    }
    if (_col < 0 || _col > 2) {
      throw new Error(`Invalid col: ${_col}. Must be between 0 and 2`);
    }
  }

  static of(row: number, col: number): Position {
    return new Position(row, col);
  }

  get row(): number {
    return this._row;
  }

  get col(): number {
    return this._col;
  }

  equals(other: Position): boolean {
    return this._row === other._row && this._col === other._col;
  }

  toString(): string {
    return `(${this._row}, ${this._col})`;
  }
}
