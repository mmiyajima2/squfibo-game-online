import { CardValue } from '../valueObjects/CardValue';
import { CardColor } from '../valueObjects/CardColor';

export class Card {
  private static idCounter = 0;

  constructor(
    public readonly value: CardValue,
    public readonly color: CardColor,
    public readonly id: string = `card-${Card.idCounter++}`
  ) {}

  isSameColor(other: Card): boolean {
    return this.color === other.color;
  }

  equals(other: Card): boolean {
    return this.id === other.id;
  }

  toString(): string {
    return `${this.color}:${this.value.value}`;
  }
}
