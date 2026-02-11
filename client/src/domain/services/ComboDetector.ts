import { Board } from '../entities/Board';
import { Card } from '../entities/Card';
import type { Position } from 'squfibo-shared';
import { positionEquals } from 'squfibo-shared';
import { Combo, ComboType } from './Combo';

export interface PlacementSuggestion {
  card: Card;           // 手札のどのカードを
  position: Position;   // どの位置に置くか
  expectedCombo: Combo; // 成立する役
  priority: number;     // 優先度（3=大役THREE_CARDS, 1=小役TRIPLE_MATCH）
}

export class ComboDetector {
  detectCombos(board: Board, lastPlacedPosition: Position): Combo[] {
    const combos: Combo[] = [];
    const lastCard = board.getCard(lastPlacedPosition);

    if (!lastCard) {
      return combos;
    }

    const allPositions: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        allPositions.push({ row: row, col: col });
      }
    }

    const threeCardCombos = this.findThreeCardCombos(
      board,
      lastCard,
      lastPlacedPosition,
      allPositions
    );
    combos.push(...threeCardCombos);

    const tripleMatch = this.findTripleMatch(
      board,
      lastCard,
      lastPlacedPosition,
      allPositions
    );
    combos.push(...tripleMatch);

    return combos;
  }

  private findThreeCardCombos(
    board: Board,
    lastCard: Card,
    lastPlacedPosition: Position,
    allPositions: Position[]
  ): Combo[] {
    const combos: Combo[] = [];
    const lastValue = lastCard.value;

    const sameColorPositions = allPositions.filter(pos => {
      if (positionEquals(pos, lastPlacedPosition)) {
        return false;
      }
      const card = board.getCard(pos);
      return card !== null && card.isSameColor(lastCard);
    });

    for (let i = 0; i < sameColorPositions.length; i++) {
      for (let j = i + 1; j < sameColorPositions.length; j++) {
        const pos1 = sameColorPositions[i];
        const pos2 = sameColorPositions[j];
        const card1 = board.getCard(pos1)!;
        const card2 = board.getCard(pos2)!;

        const values = [lastValue, card1.value, card2.value].sort((a, b) => a - b);

        if (values[0] === 1 && values[1] === 4 && values[2] === 16) {
          // 3枚役は連なっている必要がある（縦3つ、横3つ、またはL字型）
          if (this.areAdjacentThreeCards([lastPlacedPosition, pos1, pos2])) {
            combos.push(
              new Combo(
                ComboType.THREE_CARDS,
                [lastCard, card1, card2],
                [lastPlacedPosition, pos1, pos2]
              )
            );
          }
        }
      }
    }

    return combos;
  }

  private findTripleMatch(
    board: Board,
    lastCard: Card,
    lastPlacedPosition: Position,
    allPositions: Position[]
  ): Combo[] {
    const combos: Combo[] = [];
    const lastValue = lastCard.value;

    const sameColorPositions = allPositions.filter(pos => {
      if (positionEquals(pos, lastPlacedPosition)) {
        return false;
      }
      const card = board.getCard(pos);
      return card !== null && card.isSameColor(lastCard);
    });

    for (let i = 0; i < sameColorPositions.length; i++) {
      for (let j = i + 1; j < sameColorPositions.length; j++) {
        const pos1 = sameColorPositions[i];
        const pos2 = sameColorPositions[j];
        const card1 = board.getCard(pos1)!;
        const card2 = board.getCard(pos2)!;

        // Check if all three cards have the same value
        if (lastValue === card1.value && lastValue === card2.value) {
          // Check if the three positions are adjacent
          if (this.areAdjacentThreeCards([lastPlacedPosition, pos1, pos2])) {
            combos.push(
              new Combo(
                ComboType.TRIPLE_MATCH,
                [lastCard, card1, card2],
                [lastPlacedPosition, pos1, pos2]
              )
            );
          }
        }
      }
    }

    return combos;
  }

  checkCombo(cards: Card[], positions: Position[]): ComboType | null {
    if (cards.length !== positions.length) {
      return null;
    }

    if (cards.length === 0) {
      return null;
    }

    const firstColor = cards[0].color;
    if (!cards.every(card => card.color === firstColor)) {
      return null;
    }

    const values = cards.map(card => card.value).sort((a, b) => a - b);

    if (values.length === 3) {
      // 3枚役の場合、位置が連なっている必要がある（縦3つ、横3つ、またはL字型）
      if (!this.areAdjacentThreeCards(positions)) {
        return null;
      }

      if (values[0] === 1 && values[1] === 4 && values[2] === 16) {
        return ComboType.THREE_CARDS;
      }

      // Check for triple match: all three cards have the same value
      if (values[0] === values[1] && values[1] === values[2]) {
        return ComboType.TRIPLE_MATCH;
      }
    }

    return null;
  }

  suggestWinningPlacements(board: Board, hand: Card[]): PlacementSuggestion[] {
    const suggestions: PlacementSuggestion[] = [];
    const emptyPositions = this.getEmptyPositions(board);

    // 手札の各カードで、空いている全ての位置を試す
    for (const card of hand) {
      for (const position of emptyPositions) {
        // 仮想的に配置
        board.placeCard(card, position);

        // 役が成立するか確認
        const detectedCombos = this.detectCombos(board, position);

        // 元に戻す
        board.removeCard(position);

        // 成立した役を候補として追加
        for (const combo of detectedCombos) {
          suggestions.push({
            card,
            position,
            expectedCombo: combo,
            priority: this.getComboTypePriority(combo.type)
          });
        }
      }
    }

    // 優先度順にソート（高い順）
    suggestions.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return b.expectedCombo.getCardCount() - a.expectedCombo.getCardCount();
    });

    return suggestions;
  }

  /**
   * 2つの位置が縦または横に隣接しているかをチェック
   */
  private areAdjacentTwoCards(positions: Position[]): boolean {
    if (positions.length !== 2) {
      return false;
    }

    const [pos1, pos2] = positions;
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);

    // 縦に隣接（row差が1、col差が0）または横に隣接（row差が0、col差が1）
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  /**
   * 3つの位置が連なっているかをチェック（縦3つ、横3つ、またはL字型）
   */
  private areAdjacentThreeCards(positions: Position[]): boolean {
    if (positions.length !== 3) {
      return false;
    }

    // 全ての位置が互いに隣接している必要がある
    // まず、各カードが少なくとも1つの他のカードに隣接していることを確認
    const adjacencyCount = new Map<number, number>();
    for (let i = 0; i < 3; i++) {
      adjacencyCount.set(i, 0);
    }

    // 全てのペアの隣接性をチェック
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        if (this.areAdjacentTwoCards([positions[i], positions[j]])) {
          adjacencyCount.set(i, adjacencyCount.get(i)! + 1);
          adjacencyCount.set(j, adjacencyCount.get(j)! + 1);
        }
      }
    }

    // 有効な3枚役の形状：
    // - 縦または横に3枚連なる場合：両端が1つずつ、中央が2つ隣接
    // - L字型の場合：コーナーが2つ、端が1つずつ隣接
    const counts = Array.from(adjacencyCount.values()).sort();

    // 縦または横に3枚連なる: [1, 1, 2]（両端が1、中央が2）
    // L字型: [1, 1, 2]（両端が1、コーナーが2）
    return counts[0] === 1 && counts[1] === 1 && counts[2] === 2;
  }

  private getEmptyPositions(board: Board): Position[] {
    const emptyPositions: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const position = { row: row, col: col };
        if (board.isEmpty(position)) {
          emptyPositions.push(position);
        }
      }
    }
    return emptyPositions;
  }

  private getComboTypePriority(type: ComboType): number {
    switch (type) {
      case ComboType.THREE_CARDS:
        return 3; // 大役：3つ星獲得
      case ComboType.TRIPLE_MATCH:
        return 1; // 小役：1つ星獲得
      default:
        return 0;
    }
  }
}
