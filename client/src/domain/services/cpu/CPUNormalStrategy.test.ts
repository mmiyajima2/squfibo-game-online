import { describe, it, expect } from 'vitest';
import { CPUNormalStrategy } from './CPUNormalStrategy';
import { Game } from '../../Game';
import { Card } from '../../entities/Card';
import { CardValue } from '../../valueObjects/CardValue';
import { CardColor } from '../../valueObjects/CardColor';
import { Position } from '../../valueObjects/Position';
import { ComboType } from '../Combo';

describe('CPUNormalStrategy', () => {
  describe('戦略的配置: THREE_CARDSを成立させる', () => {
    it('赤1と赤4が盤面にあり、CPUが赤16を持っている場合、THREE_CARDSを成立させて申告する', () => {
      // 見落とし率5%を考慮して複数回テスト
      let claimedCount = 0;
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const game = Game.createNewGame('Normal', true); // 人間が先攻
        const strategy = new CPUNormalStrategy();

        // 人間プレイヤーが赤1と赤4を配置
        game.placeCard(new Card(CardValue.of(1), CardColor.RED), Position.of(0, 0));
        game.placeCard(new Card(CardValue.of(4), CardColor.RED), Position.of(0, 1));
        game.endTurn();

        // CPUの手札をクリアして赤16のみにする
        const cpuPlayer = game.getCurrentPlayer();
        const currentCards = cpuPlayer.hand.getCards();
        currentCards.forEach(card => cpuPlayer.playCard(card));
        cpuPlayer.hand.addCard(new Card(CardValue.of(16), CardColor.RED));

        // CPUのターンを実行
        const result = strategy.executeTurn(game);

        // 赤16が配置され、THREE_CARDSが申告されるはず（見落としでない場合）
        if (result.placedCard.value.value === 16 && result.placedCard.color === CardColor.RED) {
          if (result.claimedCombo) {
            expect(result.claimedCombo.type).toBe(ComboType.THREE_CARDS);
            claimedCount++;
          }
        }
      }

      // 見落とし率5%を考慮すると、80%以上で申告されるはず
      expect(claimedCount).toBeGreaterThanOrEqual(iterations * 0.8);
    });
  });

  describe('戦略的配置: TRIPLE_MATCHを成立させる', () => {
    it('赤4が2枚盤面にあり、CPUが赤4を持っている場合、TRIPLE_MATCHを成立させて申告する', () => {
      // 見落とし率5%を考慮して複数回テスト
      let claimedCount = 0;
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const game = Game.createNewGame('Normal', true); // 人間が先攻
        const strategy = new CPUNormalStrategy();

        // 人間プレイヤーが赤4を2枚配置
        game.placeCard(new Card(CardValue.of(4), CardColor.RED), Position.of(0, 0));
        game.placeCard(new Card(CardValue.of(4), CardColor.RED), Position.of(0, 1));
        game.endTurn();

        // CPUの手札をクリアして赤4のみにする
        const cpuPlayer = game.getCurrentPlayer();
        const currentCards = cpuPlayer.hand.getCards();
        currentCards.forEach(card => cpuPlayer.playCard(card));
        cpuPlayer.hand.addCard(new Card(CardValue.of(4), CardColor.RED));

        // CPUのターンを実行
        const result = strategy.executeTurn(game);

        // 赤4が配置され、TRIPLE_MATCHが申告されるはず（見落としでない場合）
        if (result.placedCard.value.value === 4 && result.placedCard.color === CardColor.RED) {
          if (result.claimedCombo) {
            expect(result.claimedCombo.type).toBe(ComboType.TRIPLE_MATCH);
            claimedCount++;
          }
        }
      }

      // 見落とし率5%を考慮すると、80%以上で申告されるはず
      expect(claimedCount).toBeGreaterThanOrEqual(iterations * 0.8);
    });
  });

  describe('役の優先順位', () => {
    it('THREE_CARDS > TRIPLE_MATCHの順で役を申告する', () => {
      const game = Game.createNewGame('Normal', true);
      const strategy = new CPUNormalStrategy();

      // 盤面に赤1、赤4を2枚配置（THREE_CARDSとTRIPLE_MATCHの両方が成立可能）
      game.placeCard(new Card(CardValue.of(1), CardColor.RED), Position.of(0, 0));
      game.placeCard(new Card(CardValue.of(4), CardColor.RED), Position.of(0, 1));
      game.placeCard(new Card(CardValue.of(4), CardColor.RED), Position.of(1, 0));
      game.endTurn();

      // CPUの手札をクリアして赤16と赤4を追加
      // 赤16で(0,2)または(1,1)に置くとTHREE_CARDSが成立
      // 赤4で(1,1)に置くとTRIPLE_MATCHが成立
      const cpuPlayer = game.getCurrentPlayer();
      const currentCards = cpuPlayer.hand.getCards();
      currentCards.forEach(card => cpuPlayer.playCard(card));
      cpuPlayer.hand.addCard(new Card(CardValue.of(16), CardColor.RED));
      cpuPlayer.hand.addCard(new Card(CardValue.of(4), CardColor.RED));

      const result = strategy.executeTurn(game);

      // THREE_CARDSが優先されるため、赤16が配置されるはず
      if (result.claimedCombo) {
        expect(result.claimedCombo.type).toBe(ComboType.THREE_CARDS);
      }
    });
  });

  describe('役の見落とし率', () => {
    it('約5%の確率で役を見落とす', () => {
      const iterations = 100;
      let missedCount = 0;
      let detectedCount = 0;

      for (let i = 0; i < iterations; i++) {
        const game = Game.createNewGame('Normal', true);
        const strategy = new CPUNormalStrategy();

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

      // 見落とし率が1%～10%の範囲内であることを確認（統計的な誤差を考慮）
      expect(missRate).toBeGreaterThan(0.01);
      expect(missRate).toBeLessThan(0.10);
      expect(totalCombos).toBeGreaterThan(iterations * 0.8); // 大半のケースで役が成立するはず
    });
  });

  describe('カードの優先順位', () => {
    it('役が成立しない場合、16 > 9 > 1 > 4の優先順位でカードを配置する', () => {
      // 各カードの値について、それだけを手札に持たせて配置をテスト
      const testCases = [
        { value: 16, color: CardColor.RED },
        { value: 9, color: CardColor.BLUE },
        { value: 1, color: CardColor.RED },
        { value: 4, color: CardColor.BLUE },
      ];

      for (const testCase of testCases) {
        const game = Game.createNewGame('Normal', false);
        const strategy = new CPUNormalStrategy();

        // CPUの手札をクリアして、テスト対象のカードのみにする
        const cpuPlayer = game.getCurrentPlayer();
        const currentCards = cpuPlayer.hand.getCards();
        currentCards.forEach(card => cpuPlayer.playCard(card));
        cpuPlayer.hand.addCard(new Card(CardValue.of(testCase.value), testCase.color));

        const result = strategy.executeTurn(game);

        // 配置されたカードが期待通りか確認
        expect(result.placedCard.value.value).toBe(testCase.value);
      }

      // 優先順位の動作確認：複数カードがある場合、16が優先される
      const game = Game.createNewGame('Normal', false);
      const strategy = new CPUNormalStrategy();
      const cpuPlayer = game.getCurrentPlayer();
      const currentCards = cpuPlayer.hand.getCards();
      currentCards.forEach(card => cpuPlayer.playCard(card));

      // 全てのカードを追加（異なる色で役が成立しないようにする）
      cpuPlayer.hand.addCard(new Card(CardValue.of(16), CardColor.RED));
      cpuPlayer.hand.addCard(new Card(CardValue.of(9), CardColor.BLUE));
      cpuPlayer.hand.addCard(new Card(CardValue.of(1), CardColor.RED));
      cpuPlayer.hand.addCard(new Card(CardValue.of(4), CardColor.BLUE));

      const result = strategy.executeTurn(game);

      // 16が優先的に配置されるはず
      expect(result.placedCard.value.value).toBe(16);
    });
  });
});
