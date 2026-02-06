import { describe, it, expect } from 'vitest';
import { Position } from './Position';

describe('Position', () => {
  it('should create valid positions', () => {
    const pos00 = Position.of(0, 0);
    const pos22 = Position.of(2, 2);
    const pos12 = Position.of(1, 2);

    expect(pos00.row).toBe(0);
    expect(pos00.col).toBe(0);
    expect(pos22.row).toBe(2);
    expect(pos22.col).toBe(2);
    expect(pos12.row).toBe(1);
    expect(pos12.col).toBe(2);
  });

  it('should throw error for invalid row', () => {
    expect(() => Position.of(-1, 0)).toThrow('Invalid row');
    expect(() => Position.of(3, 0)).toThrow('Invalid row');
  });

  it('should throw error for invalid col', () => {
    expect(() => Position.of(0, -1)).toThrow('Invalid col');
    expect(() => Position.of(0, 3)).toThrow('Invalid col');
  });

  it('should compare positions correctly', () => {
    const pos1a = Position.of(1, 2);
    const pos1b = Position.of(1, 2);
    const pos2 = Position.of(2, 1);

    expect(pos1a.equals(pos1b)).toBe(true);
    expect(pos1a.equals(pos2)).toBe(false);
  });

  it('should convert to string', () => {
    const pos = Position.of(1, 2);
    expect(pos.toString()).toBe('(1, 2)');
  });
});
