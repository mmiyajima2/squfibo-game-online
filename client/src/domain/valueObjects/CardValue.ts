export class CardValue {
  private static readonly VALID_VALUES = [1, 4, 9, 16] as const;

  private constructor(private readonly _value: number) {
    if (!(CardValue.VALID_VALUES as readonly number[]).includes(_value)) {
      throw new Error(`Invalid card value: ${_value}. Must be one of ${CardValue.VALID_VALUES.join(', ')}`);
    }
  }

  static of(value: number): CardValue {
    return new CardValue(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: CardValue): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value.toString();
  }
}
