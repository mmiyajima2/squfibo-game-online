import { describe, it, expect, beforeEach } from 'vitest';
import { ComboDetector } from './ComboDetector';
import { ComboType } from './Combo';
import { Board } from '../entities/Board';
import { Card } from '../entities/Card';
import { CardColor } from 'squfibo-shared';

describe('ComboDetector', () => {
  let detector: ComboDetector;
  let board: Board;

  beforeEach(() => {
    detector = new ComboDetector();
    board = new Board();
  });

  describe('detectCombos', () => {
    it('should detect 1+4+16 combo', () => {
      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.RED);
      const card16 = new Card(16, CardColor.RED);

      // L字型に配置（連なった形）
      board.placeCard(card1, { row: 0, col: 0 });
      board.placeCard(card4, { row: 0, col: 1 });
      board.placeCard(card16, { row: 1, col: 0 });

      const combos = detector.detectCombos(board, { row: 1, col: 0 });

      expect(combos.length).toBeGreaterThan(0);
      const threeCardCombo = combos.find(c => c.type === ComboType.THREE_CARDS);
      expect(threeCardCombo).toBeDefined();
      expect(threeCardCombo!.getCardCount()).toBe(3);
      expect(threeCardCombo!.getRewardStars()).toBe(3);
      expect(threeCardCombo!.getDrawCount()).toBe(3);
    });

    it('should detect TRIPLE_MATCH combo', () => {
      const card4_1 = new Card(4, CardColor.BLUE);
      const card4_2 = new Card(4, CardColor.BLUE);
      const card4_3 = new Card(4, CardColor.BLUE);

      // 横に3つ連なって配置
      board.placeCard(card4_1, { row: 1, col: 0 });
      board.placeCard(card4_2, { row: 1, col: 1 });
      board.placeCard(card4_3, { row: 1, col: 2 });

      const combos = detector.detectCombos(board, { row: 1, col: 2 });

      expect(combos.length).toBe(1);
      expect(combos[0].type).toBe(ComboType.TRIPLE_MATCH);
      expect(combos[0].getCardCount()).toBe(3);
      expect(combos[0].getRewardStars()).toBe(1);
      expect(combos[0].getDrawCount()).toBe(1);
    });

    it('should not detect combo with different colors', () => {
      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.BLUE);
      const card16 = new Card(16, CardColor.RED);

      board.placeCard(card1, { row: 0, col: 0 });
      board.placeCard(card4, { row: 0, col: 1 });
      board.placeCard(card16, { row: 0, col: 2 });

      const combos = detector.detectCombos(board, { row: 0, col: 1 });

      expect(combos.length).toBe(0);
    });

    it('should return empty array when no combos exist', () => {
      const card1 = new Card(1, CardColor.RED);
      board.placeCard(card1, { row: 0, col: 0 });

      const combos = detector.detectCombos(board, { row: 0, col: 0 });

      expect(combos.length).toBe(0);
    });

    it('should only detect combos that include last placed card', () => {
      const redCard1 = new Card(1, CardColor.RED);
      const redCard4 = new Card(4, CardColor.RED);
      const blueCard9 = new Card(9, CardColor.BLUE);

      board.placeCard(redCard1, { row: 0, col: 0 });
      board.placeCard(redCard4, { row: 0, col: 1 });
      board.placeCard(blueCard9, { row: 1, col: 1 });

      const combos = detector.detectCombos(board, { row: 1, col: 1 });

      expect(combos.length).toBe(0);
    });

    it('should detect THREE_CARDS in vertical line', () => {
      const card1 = new Card(1, CardColor.BLUE);
      const card4 = new Card(4, CardColor.BLUE);
      const card16 = new Card(16, CardColor.BLUE);

      // 縦に3つ連なる
      board.placeCard(card1, { row: 0, col: 0 });
      board.placeCard(card4, { row: 1, col: 0 });
      board.placeCard(card16, { row: 2, col: 0 });

      const combos = detector.detectCombos(board, { row: 2, col: 0 });

      expect(combos.length).toBe(1);
      expect(combos[0].type).toBe(ComboType.THREE_CARDS);
    });

    it('should not detect non-adjacent three cards', () => {
      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.RED);
      const card16 = new Card(16, CardColor.RED);

      // 斜めに配置（連なっていない）
      board.placeCard(card1, { row: 0, col: 0 });
      board.placeCard(card4, { row: 1, col: 1 });
      board.placeCard(card16, { row: 2, col: 2 });

      const combos = detector.detectCombos(board, { row: 2, col: 2 });

      expect(combos.length).toBe(0);
    });
  });

  describe('checkCombo', () => {
    it('should validate 1+4+16 combo in horizontal line', () => {
      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.RED);
      const card16 = new Card(16, CardColor.RED);

      const result = detector.checkCombo(
        [card1, card4, card16],
        [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
      );

      expect(result).toBe(ComboType.THREE_CARDS);
    });

    it('should validate TRIPLE_MATCH combo', () => {
      const card9_1 = new Card(9, CardColor.BLUE);
      const card9_2 = new Card(9, CardColor.BLUE);
      const card9_3 = new Card(9, CardColor.BLUE);

      const result = detector.checkCombo(
        [card9_1, card9_2, card9_3],
        [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
      );

      expect(result).toBe(ComboType.TRIPLE_MATCH);
    });

    it('should return null for different colors', () => {
      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.BLUE);
      const card16 = new Card(16, CardColor.RED);

      const result = detector.checkCombo(
        [card1, card4, card16],
        [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
      );

      expect(result).toBeNull();
    });

    it('should return null for invalid combination', () => {
      const card1 = new Card(1, CardColor.RED);
      const card9 = new Card(9, CardColor.RED);
      const card16 = new Card(16, CardColor.RED);

      const result = detector.checkCombo(
        [card1, card9, card16],
        [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
      );

      expect(result).toBeNull();
    });

    it('should return null when cards and positions length mismatch', () => {
      const card1 = new Card(1, CardColor.RED);

      const result = detector.checkCombo([card1], [{ row: 0, col: 0 }, { row: 1, col: 1 }]);

      expect(result).toBeNull();
    });

    it('should return null for 3-card combo with diagonal positions', () => {
      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.RED);
      const card16 = new Card(16, CardColor.RED);

      // 斜め配置
      const result = detector.checkCombo(
        [card1, card4, card16],
        [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }]
      );

      expect(result).toBeNull();
    });

    it('should validate 3-card combo in L-shape', () => {
      const card1 = new Card(1, CardColor.BLUE);
      const card4 = new Card(4, CardColor.BLUE);
      const card16 = new Card(16, CardColor.BLUE);

      // L字型配置
      // (0,0)-(0,1)
      //   |
      // (1,0)
      const result = detector.checkCombo(
        [card1, card4, card16],
        [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }]
      );

      expect(result).toBe(ComboType.THREE_CARDS);
    });

    it('should validate 3-card combo in vertical line', () => {
      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.RED);
      const card16 = new Card(16, CardColor.RED);

      // 縦に3つ連なる
      const result = detector.checkCombo(
        [card1, card4, card16],
        [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }]
      );

      expect(result).toBe(ComboType.THREE_CARDS);
    });
  });

  describe('suggestWinningPlacements', () => {
    it('should return empty array when board is full', () => {
      // Fill the entire board
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          board.placeCard(new Card(1, CardColor.RED), { row: row, col: col });
        }
      }

      const hand = [new Card(4, CardColor.RED)];
      const suggestions = detector.suggestWinningPlacements(board, hand);

      expect(suggestions.length).toBe(0);
    });

    it('should return empty array when hand is empty', () => {
      const suggestions = detector.suggestWinningPlacements(board, []);

      expect(suggestions.length).toBe(0);
    });

    it('should suggest placement for 1+4+16 three-card combo', () => {
      // Place RED 1 and RED 4 on the board
      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.RED);
      board.placeCard(card1, { row: 0, col: 0 });
      board.placeCard(card4, { row: 0, col: 1 });

      // Hand has a RED 16
      const hand = [new Card(16, CardColor.RED)];

      const suggestions = detector.suggestWinningPlacements(board, hand);

      // Should find suggestions for three-card combo
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.expectedCombo.type === ComboType.THREE_CARDS)).toBe(true);
      expect(suggestions.some(s => s.priority === 3)).toBe(true);
    });

    it('should suggest triple match with priority 1', () => {
      // Place two RED 4s on the board in adjacent positions
      const card4_1 = new Card(4, CardColor.RED);
      const card4_2 = new Card(4, CardColor.RED);
      board.placeCard(card4_1, { row: 0, col: 0 });
      board.placeCard(card4_2, { row: 0, col: 1 });

      // Hand has another RED 4
      const hand = [new Card(4, CardColor.RED)];

      const suggestions = detector.suggestWinningPlacements(board, hand);

      // Should find triple match suggestion
      expect(suggestions.length).toBeGreaterThan(0);
      const tripleMatchSuggestion = suggestions.find(
        s => s.expectedCombo.type === ComboType.TRIPLE_MATCH
      );
      expect(tripleMatchSuggestion).toBeDefined();
      expect(tripleMatchSuggestion!.priority).toBe(1);
    });

    it('should sort suggestions by priority (highest first)', () => {
      // Create a scenario with multiple possible combos
      const card1 = new Card(1, CardColor.RED);
      const card4_1 = new Card(4, CardColor.RED);
      const card4_2 = new Card(4, CardColor.RED);
      board.placeCard(card1, { row: 0, col: 0 });
      board.placeCard(card4_1, { row: 0, col: 1 });
      board.placeCard(card4_2, { row: 1, col: 0 });

      // Hand contains cards that can form different combos
      const hand = [
        new Card(16, CardColor.RED), // Can form THREE_CARDS (priority 3)
        new Card(4, CardColor.RED),  // Can form TRIPLE_MATCH (priority 1)
      ];

      const suggestions = detector.suggestWinningPlacements(board, hand);

      expect(suggestions.length).toBeGreaterThan(0);

      // Check that suggestions are sorted by priority (highest first)
      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i].priority).toBeGreaterThanOrEqual(suggestions[i + 1].priority);
      }

      // THREE_CARDS should be first
      expect(suggestions[0].expectedCombo.type).toBe(ComboType.THREE_CARDS);
    });

    it('should not suggest placements when no combos are possible', () => {
      // Place a RED 1 on the board
      const card1 = new Card(1, CardColor.RED);
      board.placeCard(card1, { row: 0, col: 0 });

      // Hand has cards that cannot form combos with RED 1
      const hand = [new Card(9, CardColor.RED)];

      const suggestions = detector.suggestWinningPlacements(board, hand);

      // Should return empty array since no valid combo can be formed
      expect(suggestions.length).toBe(0);
    });

    it('should handle multiple cards in hand', () => {
      // Place RED 1 and RED 4 on the board
      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.RED);
      board.placeCard(card1, { row: 0, col: 0 });
      board.placeCard(card4, { row: 0, col: 1 });

      // Hand has multiple cards
      const hand = [
        new Card(16, CardColor.RED), // Can form THREE_CARDS
        new Card(9, CardColor.BLUE), // Cannot form combo
        new Card(1, CardColor.BLUE), // Cannot form combo
      ];

      const suggestions = detector.suggestWinningPlacements(board, hand);

      // Should find suggestions for RED 16
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.card.value === 16 && s.card.color === CardColor.RED)).toBe(true);
    });

    it('should include multiple suggestions for the same card at different positions', () => {
      // Place RED 1 and RED 4 at two separate L-shaped positions
      const card1_1 = new Card(1, CardColor.RED);
      const card4_1 = new Card(4, CardColor.RED);
      const card1_2 = new Card(1, CardColor.RED);
      const card4_2 = new Card(4, CardColor.RED);

      // First L-shape: (0,0)-(0,1)-(1,0)
      board.placeCard(card1_1, { row: 0, col: 0 });
      board.placeCard(card4_1, { row: 0, col: 1 });

      // Second pair: (2,1)-(2,2)
      board.placeCard(card1_2, { row: 2, col: 1 });
      board.placeCard(card4_2, { row: 2, col: 2 });

      // Hand has a RED 16
      const hand = [new Card(16, CardColor.RED)];

      const suggestions = detector.suggestWinningPlacements(board, hand);

      // Should find multiple suggestions for different THREE_CARDS positions
      const threeCardSuggestions = suggestions.filter(
        s => s.expectedCombo.type === ComboType.THREE_CARDS
      );
      expect(threeCardSuggestions.length).toBeGreaterThan(0);
    });
  });
});
