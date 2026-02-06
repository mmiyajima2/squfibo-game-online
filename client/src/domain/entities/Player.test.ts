import { describe, it, expect } from 'vitest';
import { Player } from './Player';
import { Card } from './Card';
import { CardValue } from '../valueObjects/CardValue';
import { CardColor } from '../valueObjects/CardColor';

describe('Player', () => {
  it('should create player with id', () => {
    const player = new Player('player1');
    expect(player.id).toBe('player1');
    expect(player.stars).toBe(0);
    expect(player.hand.getCardCount()).toBe(0);
  });

  it('should add stars', () => {
    const player = new Player('player1');
    player.addStars(2);
    expect(player.stars).toBe(2);
    player.addStars(3);
    expect(player.stars).toBe(5);
  });

  it('should draw cards to hand', () => {
    const player = new Player('player1');
    const card = new Card(CardValue.of(1), CardColor.RED);

    player.drawToHand(card);
    expect(player.hand.getCardCount()).toBe(1);
    expect(player.hand.getCards()[0]).toBe(card);
  });

  it('should play card from hand', () => {
    const player = new Player('player1');
    const card = new Card(CardValue.of(4), CardColor.BLUE);

    player.drawToHand(card);
    const played = player.playCard(card);

    expect(played).toBe(card);
    expect(player.hand.getCardCount()).toBe(0);
  });

  it('should throw error when playing card not in hand', () => {
    const player = new Player('player1');
    const card = new Card(CardValue.of(1), CardColor.RED);

    expect(() => player.playCard(card)).toThrow('Card not found in hand');
  });
});
