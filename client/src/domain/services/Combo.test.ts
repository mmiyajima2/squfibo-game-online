import { describe, it, expect } from 'vitest';
import { Combo, ComboType } from './Combo';
import { Card } from '../entities/Card';
import { CardValue } from '../valueObjects/CardValue';
import { CardColor } from '../valueObjects/CardColor';
import { Position } from '../valueObjects/Position';

describe('Combo', () => {
  it('should create a THREE_CARDS combo', () => {
    const card1 = new Card(CardValue.of(1), CardColor.BLUE);
    const card2 = new Card(CardValue.of(4), CardColor.BLUE);
    const card3 = new Card(CardValue.of(16), CardColor.BLUE);
    const pos1 = Position.of(0, 0);
    const pos2 = Position.of(0, 1);
    const pos3 = Position.of(0, 2);

    const combo = new Combo(
      ComboType.THREE_CARDS,
      [card1, card2, card3],
      [pos1, pos2, pos3]
    );

    expect(combo.type).toBe(ComboType.THREE_CARDS);
    expect(combo.getCardCount()).toBe(3);
    expect(combo.getRewardStars()).toBe(3);
    expect(combo.getDrawCount()).toBe(3);
  });

  it('should create a TRIPLE_MATCH combo', () => {
    const card1 = new Card(CardValue.of(4), CardColor.RED);
    const card2 = new Card(CardValue.of(4), CardColor.RED);
    const card3 = new Card(CardValue.of(4), CardColor.RED);
    const pos1 = Position.of(0, 0);
    const pos2 = Position.of(0, 1);
    const pos3 = Position.of(0, 2);

    const combo = new Combo(
      ComboType.TRIPLE_MATCH,
      [card1, card2, card3],
      [pos1, pos2, pos3]
    );

    expect(combo.type).toBe(ComboType.TRIPLE_MATCH);
    expect(combo.getCardCount()).toBe(3);
    expect(combo.getRewardStars()).toBe(1);
    expect(combo.getDrawCount()).toBe(1);
  });

  it('should throw error when cards and positions length mismatch', () => {
    const card1 = new Card(CardValue.of(1), CardColor.RED);
    const card2 = new Card(CardValue.of(4), CardColor.RED);
    const card3 = new Card(CardValue.of(16), CardColor.RED);
    const pos1 = Position.of(0, 0);

    expect(
      () => new Combo(ComboType.THREE_CARDS, [card1, card2, card3], [pos1])
    ).toThrow('Cards and positions arrays must have the same length');
  });
});
