import { Card } from './Card';

export class Hand {
  private cards: Card[] = [];

  addCard(card: Card): void {
    this.cards.push(card);
  }

  removeCard(card: Card): Card {
    const index = this.cards.findIndex(c => c.equals(card));
    if (index === -1) {
      throw new Error('Card not found in hand');
    }
    const removed = this.cards.splice(index, 1)[0];
    return removed;
  }

  hasCards(): boolean {
    return this.cards.length > 0;
  }

  getCardCount(): number {
    return this.cards.length;
  }

  getCards(): Card[] {
    return [...this.cards].sort((a, b) => {
      // 第一ソート: 色（RED → BLUE）
      const colorOrder = { RED: 0, BLUE: 1 };
      const colorComparison = colorOrder[a.color] - colorOrder[b.color];
      if (colorComparison !== 0) {
        return colorComparison;
      }

      // 第二ソート: 数字の昇順
      return a.value.value - b.value.value;
    });
  }
}
