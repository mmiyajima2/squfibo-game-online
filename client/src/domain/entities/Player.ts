import { Hand } from './Hand';
import { Card } from './Card';

export class Player {
  public readonly hand: Hand;
  private _stars: number = 0;

  constructor(
    public readonly id: string
  ) {
    this.hand = new Hand();
  }

  get stars(): number {
    return this._stars;
  }

  addStars(count: number): void {
    this._stars += count;
  }

  setStars(count: number): void {
    this._stars = count;
  }

  drawToHand(card: Card): void {
    this.hand.addCard(card);
  }

  playCard(card: Card): Card {
    return this.hand.removeCard(card);
  }
}
