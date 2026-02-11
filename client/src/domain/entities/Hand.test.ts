import { describe, it, expect } from 'vitest';
import { Hand } from './Hand';
import { Card } from './Card';
import { CardColor } from 'squfibo-shared';

describe('Hand', () => {
  it('should start empty', () => {
    const hand = new Hand();
    expect(hand.hasCards()).toBe(false);
    expect(hand.getCardCount()).toBe(0);
    expect(hand.getCards()).toEqual([]);
  });

  it('should add cards', () => {
    const hand = new Hand();
    const card1 = new Card(1, CardColor.RED);
    const card2 = new Card(4, CardColor.BLUE);

    hand.addCard(card1);
    expect(hand.getCardCount()).toBe(1);
    expect(hand.hasCards()).toBe(true);

    hand.addCard(card2);
    expect(hand.getCardCount()).toBe(2);
  });

  it('should remove cards', () => {
    const hand = new Hand();
    const card1 = new Card(1, CardColor.RED);
    const card2 = new Card(4, CardColor.BLUE);

    hand.addCard(card1);
    hand.addCard(card2);

    const removed = hand.removeCard(card1);
    expect(removed).toBe(card1);
    expect(hand.getCardCount()).toBe(1);
  });

  it('should throw error when removing non-existent card', () => {
    const hand = new Hand();
    const card = new Card(1, CardColor.RED);

    expect(() => hand.removeCard(card)).toThrow('Card not found in hand');
  });

  it('should return copy of cards array', () => {
    const hand = new Hand();
    const card = new Card(1, CardColor.RED);
    hand.addCard(card);

    const cards = hand.getCards();
    cards.push(new Card(4, CardColor.BLUE));

    expect(hand.getCardCount()).toBe(1);
  });

  it('should sort cards by color then by value', () => {
    const hand = new Hand();
    const blueNine = new Card(9, CardColor.BLUE);
    const redFour = new Card(4, CardColor.RED);
    const blueFour = new Card(4, CardColor.BLUE);
    const redOne = new Card(1, CardColor.RED);
    const redSixteen = new Card(16, CardColor.RED);
    const blueOne = new Card(1, CardColor.BLUE);

    // ランダムな順序で追加
    hand.addCard(blueNine);
    hand.addCard(redFour);
    hand.addCard(blueFour);
    hand.addCard(redOne);
    hand.addCard(redSixteen);
    hand.addCard(blueOne);

    const cards = hand.getCards();

    // 期待される順序: RED（1, 4, 16）→ BLUE（1, 4, 9）
    expect(cards[0]).toBe(redOne);
    expect(cards[1]).toBe(redFour);
    expect(cards[2]).toBe(redSixteen);
    expect(cards[3]).toBe(blueOne);
    expect(cards[4]).toBe(blueFour);
    expect(cards[5]).toBe(blueNine);
  });
});
