import { describe, it, expect } from 'vitest';
import { CardValue } from './CardValue';

describe('CardValue', () => {
  it('should create valid card values', () => {
    const value1 = CardValue.of(1);
    const value4 = CardValue.of(4);
    const value9 = CardValue.of(9);
    const value16 = CardValue.of(16);

    expect(value1.value).toBe(1);
    expect(value4.value).toBe(4);
    expect(value9.value).toBe(9);
    expect(value16.value).toBe(16);
  });

  it('should throw error for invalid values', () => {
    expect(() => CardValue.of(2)).toThrow('Invalid card value');
    expect(() => CardValue.of(3)).toThrow('Invalid card value');
    expect(() => CardValue.of(0)).toThrow('Invalid card value');
    expect(() => CardValue.of(25)).toThrow('Invalid card value');
  });

  it('should compare card values correctly', () => {
    const value1a = CardValue.of(1);
    const value1b = CardValue.of(1);
    const value4 = CardValue.of(4);

    expect(value1a.equals(value1b)).toBe(true);
    expect(value1a.equals(value4)).toBe(false);
  });

  it('should convert to string', () => {
    const value = CardValue.of(16);
    expect(value.toString()).toBe('16');
  });
});
