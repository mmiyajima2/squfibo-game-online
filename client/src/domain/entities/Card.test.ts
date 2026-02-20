import { describe, it, expect } from 'vitest';
import { Card } from './Card';
import { CardColor } from 'squfibo-shared';

describe('Card', () => {
  it('should create a card with value and color', () => {
    const card = new Card(1, CardColor.RED);
    expect(card.value).toBe(1);
    expect(card.color).toBe(CardColor.RED);
    expect(card.id).toBeDefined();
  });

  it('should have unique IDs for different instances', () => {
    const card1 = new Card(1, CardColor.RED);
    const card2 = new Card(1, CardColor.RED);
    expect(card1.id).not.toBe(card2.id);
  });

  it('should check if same color', () => {
    const redCard1 = new Card(1, CardColor.RED);
    const redCard2 = new Card(4, CardColor.RED);
    const blueCard = new Card(1, CardColor.BLUE);

    expect(redCard1.isSameColor(redCard2)).toBe(true);
    expect(redCard1.isSameColor(blueCard)).toBe(false);
  });

  it('should compare cards by id', () => {
    const card1 = new Card(1, CardColor.RED);
    const card2 = new Card(1, CardColor.RED);

    expect(card1.equals(card1)).toBe(true);
    expect(card1.equals(card2)).toBe(false);
  });

  it('should convert to string', () => {
    const card = new Card(16, CardColor.BLUE);
    expect(card.toString()).toBe('BLUE:16');
  });
});
