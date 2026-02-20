import { CardColor, isValidCardValue } from 'squfibo-shared';
import type { CardValueType } from 'squfibo-shared';

export class Card {
  private static idCounter = 0;

  constructor(
    public readonly value: CardValueType,
    public readonly color: CardColor,
    public readonly id: string = `card-${Card.idCounter++}`
  ) {
    if (!isValidCardValue(value)) {
      throw new Error(`Invalid card value: ${value}`);
    }
  }

  isSameColor(other: Card): boolean {
    return this.color === other.color;
  }

  equals(other: Card): boolean {
    return this.id === other.id;
  }

  toString(): string {
    return `${this.color}:${this.value}`;
  }
}
