import { describe, it, expect } from 'vitest';
import { CardColor } from './CardColor';

describe('CardColor', () => {
  it('should have RED and BLUE values', () => {
    expect(CardColor.RED).toBe('RED');
    expect(CardColor.BLUE).toBe('BLUE');
  });

  it('should be usable in comparisons', () => {
    const getRedColor = (): CardColor => CardColor.RED;
    const getBlueColor = (): CardColor => CardColor.BLUE;

    const color1 = getRedColor();
    const color2 = getRedColor();
    const color3 = getBlueColor();

    expect(color1 === color2).toBe(true);
    expect(color1 === color3).toBe(false);
  });
});
