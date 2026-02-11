import { Card } from './Card';
import { CardColor } from 'squfibo-shared';
import type { CardValueType } from 'squfibo-shared';

export class Deck {
  constructor(private cards: Card[] = []) {}

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(): Card | null {
    return this.cards.pop() || null;
  }

  peek(): Card | null {
    return this.cards.length > 0 ? this.cards[this.cards.length - 1] : null;
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  getCardCount(): number {
    return this.cards.length;
  }

  static createInitialDeck(): Deck {
    const cards: Card[] = [];
    const cardConfig = [
      { value: 1 as CardValueType, count: 4 },
      { value: 4 as CardValueType, count: 4 },
      { value: 9 as CardValueType, count: 9 },
      { value: 16 as CardValueType, count: 4 },
    ];
    const colors = [CardColor.RED, CardColor.BLUE];

    for (const { value, count } of cardConfig) {
      for (const color of colors) {
        for (let i = 0; i < count; i++) {
          cards.push(new Card(value, color));
        }
      }
    }

    return new Deck(cards);
  }
}
