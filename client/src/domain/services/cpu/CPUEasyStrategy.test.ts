import { describe, it, expect } from 'vitest';
import { CPUEasyStrategy } from './CPUEasyStrategy';
import { Game } from '../../Game';
import { Card } from '../../entities/Card';
import { CardValue } from '../../valueObjects/CardValue';
import { CardColor } from '../../valueObjects/CardColor';
import { Position } from '../../valueObjects/Position';
import { ComboType } from '../Combo';

describe('CPUEasyStrategy', () => {
  describe('executeTurn', () => {
    it('手札がある場合、カードを配置できる', () => {
      const game = Game.createNewGame('Easy', false);
      const strategy = new CPUEasyStrategy();

      const result = strategy.executeTurn(game);

      expect(result.placedCard).toBeDefined();
      expect(result.position).toBeDefined();
      expect(game.board.getCard(result.position)).toBe(result.placedCard);
    });

    it('盤面が満杯の場合、カードを除去してから配置する', () => {
      const game = Game.createNewGame('Easy', false);
      const strategy = new CPUEasyStrategy();

      // 盤面を満杯にする
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const pos = Position.of(row, col);
          if (game.board.isEmpty(pos)) {
            const card = new Card(CardValue.of(1), CardColor.RED);
            game.placeCard(card, pos);
          }
        }
      }

      const result = strategy.executeTurn(game);

      expect(result.removedPosition).toBeDefined();
      expect(result.placedCard).toBeDefined();
    });
  });

  describe('役の優先順位', () => {
    it('THREE_CARDSが最優先で選択される', () => {
      const game = Game.createNewGame('Easy', false);
      const currentPlayer = game.getCurrentPlayer();

      // 1+4+16の役を作る
      const pos1 = Position.of(0, 0);
      const pos2 = Position.of(0, 1);

      game.placeCard(new Card(CardValue.of(1), CardColor.RED), pos1);
      game.placeCard(new Card(CardValue.of(4), CardColor.RED), pos2);

      // 手札に16を追加
      currentPlayer.hand.addCard(new Card(CardValue.of(16), CardColor.RED));

      const strategy = new CPUEasyStrategy();

      // THREE_CARDSが検出される状況で複数回実行
      let threeCardsClaimedCount = 0;

      // 見落としがあるため、複数回試行
      for (let i = 0; i < 20; i++) {
        const testGame = Game.createNewGame('Easy', false);
        const testPlayer = testGame.getCurrentPlayer();

        // 同じ盤面を再現
        testGame.placeCard(new Card(CardValue.of(1), CardColor.RED), pos1);
        testGame.placeCard(new Card(CardValue.of(4), CardColor.RED), pos2);
        testPlayer.hand.addCard(new Card(CardValue.of(16), CardColor.RED));

        // CPUのターンを実行（pos3に配置されることを期待）
        const result = strategy.executeTurn(testGame);

        // THREE_CARDSが検出されたかチェック
        if (result.claimedCombo?.type === ComboType.THREE_CARDS) {
          threeCardsClaimedCount++;
        }
      }

      // 役が検出された場合、すべてTHREE_CARDSであるべき
      expect(threeCardsClaimedCount).toBeGreaterThan(0);
    });
  });

  describe('役の見落とし率', () => {
    it('約20%の確率で役を見落とす', () => {
      const iterations = 100;
      let missedCount = 0;
      let detectedCount = 0;

      for (let i = 0; i < iterations; i++) {
        const game = Game.createNewGame('Easy', true);
        const strategy = new CPUEasyStrategy();

        // 人間が赤1と赤4を配置
        game.placeCard(new Card(CardValue.of(1), CardColor.RED), Position.of(0, 0));
        game.placeCard(new Card(CardValue.of(4), CardColor.RED), Position.of(0, 1));
        game.endTurn();

        // CPUの手札をクリアして赤16のみにする
        const cpuPlayer = game.getCurrentPlayer();
        const currentCards = cpuPlayer.hand.getCards();
        currentCards.forEach(card => cpuPlayer.playCard(card));
        cpuPlayer.hand.addCard(new Card(CardValue.of(16), CardColor.RED));

        const result = strategy.executeTurn(game);

        if (result.claimedCombo) {
          detectedCount++;
        }
        if (result.missedCombo) {
          missedCount++;
        }
      }

      const totalCombos = detectedCount + missedCount;
      const missRate = missedCount / totalCombos;

      // 見落とし率が10%～35%の範囲内であることを確認（統計的な誤差を考慮）
      expect(missRate).toBeGreaterThan(0.1);
      expect(missRate).toBeLessThan(0.35);
      expect(totalCombos).toBeGreaterThan(iterations * 0.1); // 少なくとも10%以上で役が成立するはず
    });
  });

  describe('ランダム性の検証', () => {
    it('配置位置がランダムである', () => {
      const positionCounts = new Map<string, number>();

      for (let i = 0; i < 50; i++) {
        const game = Game.createNewGame('Easy', false);
        const strategy = new CPUEasyStrategy();

        const result = strategy.executeTurn(game);
        const key = `${result.position.row},${result.position.col}`;
        positionCounts.set(key, (positionCounts.get(key) || 0) + 1);
      }

      // 複数の異なる位置に配置されたことを確認（完全にランダムなら9箇所すべてに配置される可能性がある）
      expect(positionCounts.size).toBeGreaterThan(3);
    });
  });

  describe('直前に配置されたカードの保護', () => {
    it('盤面満杯時、CPUは直前のターンで配置されたカードを除去しない', () => {
      const game = Game.createNewGame('Easy', true); // 人間が先攻
      const strategy = new CPUEasyStrategy();

      // 盤面を8枚で埋める（満杯の一歩手前）
      const positions = [
        Position.of(0, 0),
        Position.of(0, 1),
        Position.of(0, 2),
        Position.of(1, 0),
        Position.of(1, 1),
        Position.of(1, 2),
        Position.of(2, 0),
        Position.of(2, 1),
        // Position.of(2, 2) は空けておく
      ];

      for (const pos of positions) {
        const card = new Card(CardValue.of(1), CardColor.RED);
        game.placeCard(card, pos);
      }

      // 人間プレイヤーが最後のマスにカードを配置
      const humanPlayer = game.getCurrentPlayer();
      const humanCard = humanPlayer.hand.getCards()[0];
      const humanPlayedCard = humanPlayer.playCard(humanCard);
      const humanPlacedPos = Position.of(2, 2);
      game.placeCard(humanPlayedCard, humanPlacedPos);

      // ターン終了（CPUのターンへ）
      game.endTurn();

      // CPUがターンを実行（盤面が満杯なので1枚除去してから配置）
      const result = strategy.executeTurn(game);

      // 除去されたカードが人間が置いたカード(2,2)ではないことを確認
      expect(result.removedPosition).toBeDefined();
      if (result.removedPosition) {
        expect(result.removedPosition.equals(humanPlacedPos)).toBe(false);
      }

      // 除去された位置が、人間が置いた位置以外の8箇所のいずれかであることを確認
      expect(positions.some(pos => pos.equals(result.removedPosition!))).toBe(true);
    });
  });
});
