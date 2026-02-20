import { Card } from './Card';
import type { Position } from 'squfibo-shared';

export class Board {
  private cells: (Card | null)[][] = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];

  placeCard(card: Card, position: Position): void {
    if (!this.isEmpty(position)) {
      throw new Error(`Position ${position.toString()} is already occupied`);
    }
    this.cells[position.row][position.col] = card;
  }

  removeCard(position: Position): Card | null {
    const card = this.cells[position.row][position.col];
    this.cells[position.row][position.col] = null;
    return card;
  }

  getCard(position: Position): Card | null {
    return this.cells[position.row][position.col];
  }

  isFull(): boolean {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (this.cells[row][col] === null) {
          return false;
        }
      }
    }
    return true;
  }

  isEmpty(position: Position): boolean {
    return this.cells[position.row][position.col] === null;
  }

  getCards(): Card[] {
    const cards: Card[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const card = this.cells[row][col];
        if (card !== null) {
          cards.push(card);
        }
      }
    }
    return cards;
  }

  findCardPositions(cards: Card[]): Position[] {
    const positions: Position[] = [];
    for (const targetCard of cards) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const card = this.cells[row][col];
          if (card !== null && card.equals(targetCard)) {
            positions.push({ row: row, col: col });
          }
        }
      }
    }
    return positions;
  }
}
