import { describe, it, expect } from 'vitest';
import { Board } from './Board';
import { Card } from './Card';
import { CardColor } from 'squfibo-shared';
import { positionEquals } from 'squfibo-shared';

describe('Board', () => {
  it('should start with all empty cells', () => {
    const board = new Board();
    expect(board.isFull()).toBe(false);
    expect(board.getCards()).toEqual([]);

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        expect(board.isEmpty({ row: row, col: col })).toBe(true);
      }
    }
  });

  it('should place cards on the board', () => {
    const board = new Board();
    const card = new Card(1, CardColor.RED);
    const pos = { row: 0, col: 0 };

    board.placeCard(card, pos);
    expect(board.isEmpty(pos)).toBe(false);
    expect(board.getCard(pos)).toBe(card);
  });

  it('should throw error when placing card on occupied position', () => {
    const board = new Board();
    const card1 = new Card(1, CardColor.RED);
    const card2 = new Card(4, CardColor.BLUE);
    const pos = { row: 1, col: 1 };

    board.placeCard(card1, pos);
    expect(() => board.placeCard(card2, pos)).toThrow('already occupied');
  });

  it('should remove cards from the board', () => {
    const board = new Board();
    const card = new Card(1, CardColor.RED);
    const pos = { row: 2, col: 2 };

    board.placeCard(card, pos);
    const removed = board.removeCard(pos);

    expect(removed).toBe(card);
    expect(board.isEmpty(pos)).toBe(true);
  });

  it('should detect when board is full', () => {
    const board = new Board();

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const card = new Card(1, CardColor.RED);
        board.placeCard(card, { row: row, col: col });
      }
    }

    expect(board.isFull()).toBe(true);
  });

  it('should get all cards on the board', () => {
    const board = new Board();
    const card1 = new Card(1, CardColor.RED);
    const card2 = new Card(4, CardColor.BLUE);
    const card3 = new Card(9, CardColor.RED);

    board.placeCard(card1, { row: 0, col: 0 });
    board.placeCard(card2, { row: 1, col: 1 });
    board.placeCard(card3, { row: 2, col: 2 });

    const cards = board.getCards();
    expect(cards.length).toBe(3);
    expect(cards).toContain(card1);
    expect(cards).toContain(card2);
    expect(cards).toContain(card3);
  });

  it('should find card positions', () => {
    const board = new Board();
    const card1 = new Card(1, CardColor.RED);
    const card2 = new Card(4, CardColor.BLUE);

    const pos1 = { row: 0, col: 1 };
    const pos2 = { row: 2, col: 0 };

    board.placeCard(card1, pos1);
    board.placeCard(card2, pos2);

    const positions = board.findCardPositions([card1, card2]);
    expect(positions.length).toBe(2);
    expect(positions.some(p => positionEquals(p, pos1))).toBe(true);
    expect(positions.some(p => positionEquals(p, pos2))).toBe(true);
  });
});
