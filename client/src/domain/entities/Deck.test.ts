import { describe, it, expect } from 'vitest';
import { Deck } from './Deck';
import { Card } from './Card';
import { CardValue } from '../valueObjects/CardValue';
import { CardColor } from '../valueObjects/CardColor';

describe('Deck', () => {
  it('should create empty deck', () => {
    const deck = new Deck();
    expect(deck.isEmpty()).toBe(true);
    expect(deck.getCardCount()).toBe(0);
  });

  it('should draw cards from deck', () => {
    const card1 = new Card(CardValue.of(1), CardColor.RED);
    const card2 = new Card(CardValue.of(4), CardColor.BLUE);
    const deck = new Deck([card1, card2]);

    expect(deck.getCardCount()).toBe(2);

    const drawn = deck.draw();
    expect(drawn).toBe(card2);
    expect(deck.getCardCount()).toBe(1);
  });

  it('should return null when drawing from empty deck', () => {
    const deck = new Deck();
    expect(deck.draw()).toBeNull();
  });

  it('should shuffle cards', () => {
    const cards: Card[] = [];
    for (let i = 0; i < 20; i++) {
      cards.push(new Card(CardValue.of(1), CardColor.RED));
    }

    const deck = new Deck([...cards]);

    deck.shuffle();

    expect(deck.getCardCount()).toBe(20);
  });

  it('should create initial deck with 42 cards', () => {
    const deck = Deck.createInitialDeck();
    expect(deck.getCardCount()).toBe(42);
  });

  it('should create initial deck with correct distribution', () => {
    const deck = Deck.createInitialDeck();
    const cards: Card[] = [];

    while (!deck.isEmpty()) {
      const card = deck.draw();
      if (card) cards.push(card);
    }

    const countByValueAndColor = new Map<string, number>();
    for (const card of cards) {
      const key = `${card.color}:${card.value.value}`;
      countByValueAndColor.set(key, (countByValueAndColor.get(key) || 0) + 1);
    }

    expect(countByValueAndColor.get('RED:1')).toBe(4);
    expect(countByValueAndColor.get('BLUE:1')).toBe(4);
    expect(countByValueAndColor.get('RED:4')).toBe(4);
    expect(countByValueAndColor.get('BLUE:4')).toBe(4);
    expect(countByValueAndColor.get('RED:9')).toBe(9);
    expect(countByValueAndColor.get('BLUE:9')).toBe(9);
    expect(countByValueAndColor.get('RED:16')).toBe(4);
    expect(countByValueAndColor.get('BLUE:16')).toBe(4);
  });
});
