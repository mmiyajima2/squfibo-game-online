import { Hand } from './Hand';
import { Card } from './Card';
import type { CPUDifficulty } from '../../types/CPUDifficulty';

export class Player {
  public readonly hand: Hand;
  private _stars: number = 0;

  constructor(
    public readonly id: string,
    public readonly cpuDifficulty?: CPUDifficulty
  ) {
    this.hand = new Hand();
  }

  get stars(): number {
    return this._stars;
  }

  addStars(count: number): void {
    this._stars += count;
  }

  drawToHand(card: Card): void {
    this.hand.addCard(card);
  }

  playCard(card: Card): Card {
    return this.hand.removeCard(card);
  }

  isCPU(): boolean {
    return this.cpuDifficulty !== undefined;
  }
}
