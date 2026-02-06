import { Card } from '../../entities/Card';
import { Position } from '../../valueObjects/Position';
import { Combo, ComboType } from '../Combo';
import { ComboDetector } from '../ComboDetector';
import type { Game } from '../../Game';
import type { CPUStrategy, CPUTurnResult, CPUTurnPlan, CPUActionStep } from './CPUStrategy';

/**
 * CPU（Easy）戦略の実装
 *
 * 【特徴】
 * - カード配置：完全ランダム
 * - 役の申告：20%の確率で見落とす
 * - 対象プレイヤー：ゲームに慣れ始めた小学生
 */
export class CPUEasyStrategy implements CPUStrategy {
  private readonly comboDetector = new ComboDetector();

  /**
   * CPUの1ターンを計画する（状態変更なし）
   *
   * @param game 現在のゲーム状態
   * @returns ターン実行計画
   */
  planTurn(game: Game): CPUTurnPlan {
    const steps: CPUActionStep[] = [];
    let missedCombo: Combo | null = null;
    let removedPosition: Position | undefined;
    let removedCard: Card | null = null;

    // ステップ1（オプション）: 盤面満杯の場合、ランダムに1枚除去
    if (game.board.isFull()) {
      const excludePosition = game.getLastPlacedPosition();
      removedPosition = this.selectRandomOccupiedPosition(game, excludePosition);
      // planTurnでは一時的に除去（シミュレーション用）
      removedCard = game.board.removeCard(removedPosition);
      steps.push({ type: 'REMOVE_CARD', position: removedPosition });
    }

    // ステップ2: カード配置を決定
    const { card, position } = this.decidePlacement(game, removedPosition);

    let placedCard: Card;
    if (card !== null) {
      // 手札からカードを出して配置
      steps.push({ type: 'PLACE_CARD', card, position, isFromDeck: false });
      placedCard = card;
    } else {
      // 手札がない場合は山札から引いて配置
      const deckCard = game.deck.peek();
      if (!deckCard) {
        throw new Error('Deck is empty');
      }
      steps.push({ type: 'PLACE_CARD', card: deckCard, position, isFromDeck: true });
      placedCard = deckCard;
    }

    // ステップ3: 役の検出（将来の盤面状態をシミュレート）
    // 一時的にカードを配置して役を検出し、その後削除
    game.board.placeCard(placedCard, position);
    const detectedCombos = this.comboDetector.detectCombos(game.board, position);
    game.board.removeCard(position);

    // 除去したカードを元に戻す（planTurnはゲーム状態を変更しないため）
    if (removedCard && removedPosition) {
      game.board.placeCard(removedCard, removedPosition);
    }

    // ステップ4: 役の申告判定
    const { claimedCombo, missedCombo: missed } = this.decideCombo(detectedCombos);

    if (claimedCombo) {
      steps.push({ type: 'CLAIM_COMBO', combo: claimedCombo });
    }

    missedCombo = missed;

    // ステップ5: ターン終了
    steps.push({ type: 'END_TURN' });

    return { steps, missedCombo };
  }

  executeTurn(game: Game): CPUTurnResult {
    const currentPlayer = game.getCurrentPlayer();
    let removedPosition: Position | undefined;

    // ステップ1: 盤面満杯の場合、ランダムに1枚除去
    if (game.board.isFull()) {
      // 直前のターンで配置されたカードは除去しない（公平性のため）
      const excludePosition = game.getLastPlacedPosition();
      removedPosition = this.selectRandomOccupiedPosition(game, excludePosition);
      game.discardFromBoard(removedPosition);
    }

    // ステップ2: カードを配置
    const { card, position } = this.decidePlacement(game, removedPosition);
    let placedCard: Card;

    if (card !== null) {
      // 手札からカードを出して配置
      currentPlayer.playCard(card);
      game.placeCard(card, position);
      placedCard = card;
    } else {
      // 手札がない場合は山札から引いて配置
      const drawnCard = game.drawAndPlaceCard(position);
      if (!drawnCard) {
        throw new Error('Failed to draw and place card');
      }
      placedCard = drawnCard;
    }

    // ステップ3: 役の検出
    const detectedCombos = this.comboDetector.detectCombos(game.board, position);

    // ステップ4: 役の申告判定
    const { claimedCombo, missedCombo } = this.decideCombo(detectedCombos);

    // ステップ5: 役を申告する場合、ゲームに適用
    if (claimedCombo) {
      game.claimCombo(claimedCombo);
      // 役申告後は明示的にターン終了（ドメインレイヤーでは自動終了しない）
      game.endTurn();
    } else {
      // 役を申告しない場合は、明示的にターン終了
      game.endTurn();
    }

    return {
      placedCard,
      position,
      removedPosition,
      claimedCombo,
      missedCombo,
    };
  }

  /**
   * カード配置を決定する
   *
   * 【戦略】
   * - 手札がある場合：手札からランダムに1枚選び、空きマスにランダムに配置
   * - 手札がない場合：空きマスをランダムに選択（山札から引いて配置する準備）
   *
   * @param game 現在のゲーム状態
   * @param removedPosition 除去予定の位置（planTurn時のみ使用）
   * @returns 配置するカードと位置（手札がない場合はcard: null）
   */
  private decidePlacement(game: Game, removedPosition?: Position): { card: Card | null; position: Position } {
    const currentPlayer = game.getCurrentPlayer();
    const emptyPositions = this.getEmptyPositions(game, removedPosition);

    if (emptyPositions.length === 0) {
      throw new Error('No empty positions available');
    }

    const position = this.selectRandomPosition(emptyPositions);

    if (currentPlayer.hand.hasCards()) {
      // 手札からランダムに1枚選択
      const handCards = currentPlayer.hand.getCards();
      const card = this.selectRandomCard(handCards);
      return { card, position };
    } else {
      // 手札がない場合、位置だけを決定（実際のカードはdrawAndPlaceCardで引く）
      return { card: null, position };
    }
  }

  /**
   * 役の申告を判定する
   *
   * 【戦略】
   * 1. 検出された役の中から優先順位に従って1つ選択
   * 2. 20%の確率（1/5）で見落とす
   *
   * 【優先順位】
   * THREE_CARDS（大役）> TRIPLE_MATCH（小役）
   *
   * @param detectedCombos 検出された役のリスト
   * @returns 申告する役と見落とした役
   */
  private decideCombo(detectedCombos: Combo[]): {
    claimedCombo: Combo | null;
    missedCombo: Combo | null;
  } {
    if (detectedCombos.length === 0) {
      return { claimedCombo: null, missedCombo: null };
    }

    // 優先順位に従って役を選択
    const selectedCombo = this.selectComboByPriority(detectedCombos);

    // 20%の確率で見落とす
    if (this.shouldMissCombo()) {
      return { claimedCombo: null, missedCombo: selectedCombo };
    }

    return { claimedCombo: selectedCombo, missedCombo: null };
  }

  /**
   * 優先順位に従って役を選択する
   *
   * @param combos 検出された役のリスト
   * @returns 優先順位が最も高い役
   */
  private selectComboByPriority(combos: Combo[]): Combo {
    const priority = [
      ComboType.THREE_CARDS,
      ComboType.TRIPLE_MATCH,
    ];

    for (const type of priority) {
      const combo = combos.find((c) => c.type === type);
      if (combo) {
        return combo;
      }
    }

    // フォールバック：最初の役を返す（通常はここに到達しない）
    return combos[0];
  }

  /**
   * 役を見落とすかどうかを判定する
   *
   * 【仕様】
   * - 1～5の整数をランダムに生成
   * - 5が出た場合（20%の確率）、役を見落とす
   *
   * @returns true: 見落とす, false: 申告する
   */
  private shouldMissCombo(): boolean {
    const randomValue = Math.floor(Math.random() * 5) + 1;
    return randomValue === 5;
  }

  /**
   * 空いている位置のリストを取得する
   *
   * @param game 現在のゲーム状態
   * @param removedPosition 除去予定の位置（この位置は空きとして扱う）
   * @returns 空いている位置のリスト
   */
  private getEmptyPositions(game: Game, removedPosition?: Position): Position[] {
    const emptyPositions: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const position = Position.of(row, col);
        // 実際に空いているか、除去予定の位置の場合は空きとして扱う
        if (game.board.isEmpty(position) || (removedPosition && position.equals(removedPosition))) {
          emptyPositions.push(position);
        }
      }
    }
    return emptyPositions;
  }

  /**
   * ランダムに位置を選択する
   *
   * @param positions 位置のリスト
   * @returns ランダムに選ばれた位置
   */
  private selectRandomPosition(positions: Position[]): Position {
    const randomIndex = Math.floor(Math.random() * positions.length);
    return positions[randomIndex];
  }

  /**
   * ランダムにカードを選択する
   *
   * @param cards カードのリスト
   * @returns ランダムに選ばれたカード
   */
  private selectRandomCard(cards: Card[]): Card {
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex];
  }

  /**
   * 盤面からランダムに占有されている位置を選択する
   *
   * @param game 現在のゲーム状態
   * @param excludePosition 除外する位置（直前のターンで配置されたカードなど）
   * @returns ランダムに選ばれた占有されている位置
   */
  private selectRandomOccupiedPosition(game: Game, excludePosition: Position | null = null): Position {
    const occupiedPositions: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const position = Position.of(row, col);
        // 空でなく、除外位置でもない場合のみ追加
        if (!game.board.isEmpty(position)) {
          if (excludePosition === null || !position.equals(excludePosition)) {
            occupiedPositions.push(position);
          }
        }
      }
    }

    if (occupiedPositions.length === 0) {
      // 除外位置以外に選択肢がない場合は、除外位置を返す
      // （盤面が1枚しかないなど極端なケース対策）
      if (excludePosition !== null && !game.board.isEmpty(excludePosition)) {
        return excludePosition;
      }
      throw new Error('No occupied positions available');
    }

    return this.selectRandomPosition(occupiedPositions);
  }
}
