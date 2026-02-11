import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameState } from './Game';
import { Card } from './entities/Card';
import { CardColor } from 'squfibo-shared';
import { Combo, ComboType } from './services/Combo';

describe('Game', () => {
  let game: Game;

  beforeEach(() => {
    game = Game.createNewGame();
  });

  describe('createNewGame', () => {
    it('should initialize game with correct state', () => {
      expect(game.board).toBeDefined();
      expect(game.deck).toBeDefined();
      expect(game.players.length).toBe(2);
      expect(game.getTotalStars()).toBe(21);
      expect(game.getGameState()).toBe(GameState.PLAYING);
    });

    it('should deal 8 cards to each player', () => {
      expect(game.players[0].hand.getCardCount()).toBe(8);
      expect(game.players[1].hand.getCardCount()).toBe(8);
    });

    it('should have 26 cards remaining in deck after dealing', () => {
      expect(game.deck.getCardCount()).toBe(26);
    });

    it('should start with player 1', () => {
      const currentPlayer = game.getCurrentPlayer();
      expect(currentPlayer.id).toBe('player1');
    });
  });

  describe('getCurrentPlayer and getOpponent', () => {
    it('should return current player', () => {
      const player = game.getCurrentPlayer();
      expect(player).toBe(game.players[0]);
    });

    it('should return opponent', () => {
      const opponent = game.getOpponent();
      expect(opponent).toBe(game.players[1]);
    });

    it('should switch after endTurn', () => {
      const firstPlayer = game.getCurrentPlayer();
      game.endTurn();
      const secondPlayer = game.getCurrentPlayer();

      expect(firstPlayer).not.toBe(secondPlayer);
    });
  });

  describe('placeCard', () => {
    it('should place card on board', () => {
      const currentPlayer = game.getCurrentPlayer();
      const card = currentPlayer.hand.getCards()[0];
      const position = { row: 0, col: 0 };

      currentPlayer.playCard(card);
      game.placeCard(card, position);

      expect(game.board.getCard(position)).toBe(card);
    });

    it('should throw error when placing on occupied position', () => {
      const card1 = new Card(1, CardColor.RED);
      const card2 = new Card(4, CardColor.BLUE);
      const position = { row: 1, col: 1 };

      game.placeCard(card1, position);

      expect(() => game.placeCard(card2, position)).toThrow('Position is not empty');
    });

    it('should throw error when game is finished', () => {
      const card = new Card(1, CardColor.RED);

      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }
      game.endTurn();

      expect(() => game.placeCard(card, { row: 0, col: 0 })).toThrow('Game is already finished');
    });
  });

  describe('discardFromBoard', () => {
    it('should discard card from board', () => {
      const card = new Card(1, CardColor.RED);
      const position = { row: 1, col: 1 };

      game.placeCard(card, position);
      game.discardFromBoard(position);

      expect(game.board.isEmpty(position)).toBe(true);
      expect(game.getDiscardPileCount()).toBe(1);
    });

    it('should handle discarding from empty position', () => {
      const position = { row: 0, col: 0 };
      game.discardFromBoard(position);

      expect(game.board.isEmpty(position)).toBe(true);
    });
  });

  describe('claimCombo', () => {
    it('should remove cards from board when claiming THREE_CARDS', () => {
      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.RED);
      const card16 = new Card(16, CardColor.RED);
      const pos1 = { row: 0, col: 0 };
      const pos2 = { row: 0, col: 1 };
      const pos3 = { row: 0, col: 2 };

      game.placeCard(card1, pos1);
      game.placeCard(card4, pos2);
      game.placeCard(card16, pos3);

      const combo = new Combo(ComboType.THREE_CARDS, [card1, card4, card16], [pos1, pos2, pos3]);
      game.claimCombo(combo);

      expect(game.board.isEmpty(pos1)).toBe(true);
      expect(game.board.isEmpty(pos2)).toBe(true);
      expect(game.board.isEmpty(pos3)).toBe(true);
    });

    it('should draw 3 cards for THREE_CARDS combo', () => {
      const currentPlayer = game.getCurrentPlayer();
      const initialHandCount = currentPlayer.hand.getCardCount();
      const initialDeckCount = game.deck.getCardCount();

      const card1 = new Card(1, CardColor.BLUE);
      const card4 = new Card(4, CardColor.BLUE);
      const card16 = new Card(16, CardColor.BLUE);
      const pos1 = { row: 1, col: 0 };
      const pos2 = { row: 1, col: 1 };
      const pos3 = { row: 1, col: 2 };

      game.placeCard(card1, pos1);
      game.placeCard(card4, pos2);
      game.placeCard(card16, pos3);

      const combo = new Combo(ComboType.THREE_CARDS, [card1, card4, card16], [pos1, pos2, pos3]);
      game.claimCombo(combo);

      expect(currentPlayer.hand.getCardCount()).toBe(initialHandCount + 3);
      expect(game.deck.getCardCount()).toBe(initialDeckCount - 3);
    });

    it('should award 3 stars for THREE_CARDS combo', () => {
      const currentPlayer = game.getCurrentPlayer();
      const initialStars = currentPlayer.stars;

      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.RED);
      const card16 = new Card(16, CardColor.RED);
      const pos1 = { row: 0, col: 0 };
      const pos2 = { row: 0, col: 1 };
      const pos3 = { row: 0, col: 2 };

      game.placeCard(card1, pos1);
      game.placeCard(card4, pos2);
      game.placeCard(card16, pos3);

      const combo = new Combo(ComboType.THREE_CARDS, [card1, card4, card16], [pos1, pos2, pos3]);
      game.claimCombo(combo);

      expect(currentPlayer.stars).toBe(initialStars + 3);
      expect(game.getTotalStars()).toBe(18);
    });

    it('should remove cards from board when claiming TRIPLE_MATCH', () => {
      const card4_1 = new Card(4, CardColor.BLUE);
      const card4_2 = new Card(4, CardColor.BLUE);
      const card4_3 = new Card(4, CardColor.BLUE);
      const pos1 = { row: 0, col: 0 };
      const pos2 = { row: 0, col: 1 };
      const pos3 = { row: 0, col: 2 };

      game.placeCard(card4_1, pos1);
      game.placeCard(card4_2, pos2);
      game.placeCard(card4_3, pos3);

      const combo = new Combo(ComboType.TRIPLE_MATCH, [card4_1, card4_2, card4_3], [pos1, pos2, pos3]);
      game.claimCombo(combo);

      expect(game.board.isEmpty(pos1)).toBe(true);
      expect(game.board.isEmpty(pos2)).toBe(true);
      expect(game.board.isEmpty(pos3)).toBe(true);
    });

    it('should draw 1 card for TRIPLE_MATCH combo', () => {
      const currentPlayer = game.getCurrentPlayer();
      const initialHandCount = currentPlayer.hand.getCardCount();
      const initialDeckCount = game.deck.getCardCount();

      const card9_1 = new Card(9, CardColor.RED);
      const card9_2 = new Card(9, CardColor.RED);
      const card9_3 = new Card(9, CardColor.RED);
      const pos1 = { row: 1, col: 0 };
      const pos2 = { row: 1, col: 1 };
      const pos3 = { row: 1, col: 2 };

      game.placeCard(card9_1, pos1);
      game.placeCard(card9_2, pos2);
      game.placeCard(card9_3, pos3);

      const combo = new Combo(ComboType.TRIPLE_MATCH, [card9_1, card9_2, card9_3], [pos1, pos2, pos3]);
      game.claimCombo(combo);

      expect(currentPlayer.hand.getCardCount()).toBe(initialHandCount + 1);
      expect(game.deck.getCardCount()).toBe(initialDeckCount - 1);
    });

    it('should award 1 star for TRIPLE_MATCH combo', () => {
      const currentPlayer = game.getCurrentPlayer();
      const initialStars = currentPlayer.stars;

      const card16_1 = new Card(16, CardColor.BLUE);
      const card16_2 = new Card(16, CardColor.BLUE);
      const card16_3 = new Card(16, CardColor.BLUE);
      const pos1 = { row: 2, col: 0 };
      const pos2 = { row: 2, col: 1 };
      const pos3 = { row: 2, col: 2 };

      game.placeCard(card16_1, pos1);
      game.placeCard(card16_2, pos2);
      game.placeCard(card16_3, pos3);

      const combo = new Combo(ComboType.TRIPLE_MATCH, [card16_1, card16_2, card16_3], [pos1, pos2, pos3]);
      game.claimCombo(combo);

      expect(currentPlayer.stars).toBe(initialStars + 1);
      expect(game.getTotalStars()).toBe(20);
    });

    it('should handle combo when deck is empty', () => {
      const currentPlayer = game.getCurrentPlayer();
      const initialHandCount = currentPlayer.hand.getCardCount();

      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }

      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.RED);
      const card16 = new Card(16, CardColor.RED);
      const pos1 = { row: 0, col: 0 };
      const pos2 = { row: 0, col: 1 };
      const pos3 = { row: 0, col: 2 };

      game.placeCard(card1, pos1);
      game.placeCard(card4, pos2);
      game.placeCard(card16, pos3);

      const combo = new Combo(ComboType.THREE_CARDS, [card1, card4, card16], [pos1, pos2, pos3]);
      const result = game.claimCombo(combo);

      expect(result).toBe(true);
      expect(currentPlayer.hand.getCardCount()).toBe(initialHandCount);
    });

    it('should handle combo when not enough stars available', () => {
      const currentPlayer = game.getCurrentPlayer();

      // 星を18個まで使い切る（残り3個）
      for (let i = 0; i < 18; i++) {
        const card = new Card(1, CardColor.RED);
        const card2 = new Card(1, CardColor.RED);
        const card3 = new Card(1, CardColor.RED);
        game.placeCard(card, { row: 0, col: 0 });
        game.placeCard(card2, { row: 0, col: 1 });
        game.placeCard(card3, { row: 0, col: 2 });
        const combo = new Combo(
          ComboType.TRIPLE_MATCH,
          [card, card2, card3],
          [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
        );
        game.claimCombo(combo);
      }

      expect(game.getTotalStars()).toBe(3);

      const card1 = new Card(1, CardColor.BLUE);
      const card4 = new Card(4, CardColor.BLUE);
      const card16 = new Card(16, CardColor.BLUE);
      const pos1 = { row: 1, col: 0 };
      const pos2 = { row: 1, col: 1 };
      const pos3 = { row: 1, col: 2 };

      game.placeCard(card1, pos1);
      game.placeCard(card4, pos2);
      game.placeCard(card16, pos3);

      const combo = new Combo(
        ComboType.THREE_CARDS,
        [card1, card4, card16],
        [pos1, pos2, pos3]
      );

      const initialStars = currentPlayer.stars;
      game.claimCombo(combo);

      expect(currentPlayer.stars).toBe(initialStars + 3);
      expect(game.getTotalStars()).toBe(0);
    });

    it('should return false when claiming combo in finished game', () => {
      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }
      game.endTurn();

      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.RED);
      const card16 = new Card(16, CardColor.RED);
      const combo = new Combo(
        ComboType.THREE_CARDS,
        [card1, card4, card16],
        [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
      );

      const result = game.claimCombo(combo);
      expect(result).toBe(false);
    });
  });

  describe('endTurn', () => {
    it('should switch to next player', () => {
      const player1 = game.getCurrentPlayer();
      game.endTurn();
      const player2 = game.getCurrentPlayer();

      expect(player1).not.toBe(player2);
      expect(player2.id).toBe('player2');
    });

    it('should finish game when deck is empty', () => {
      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }

      expect(game.isGameOver()).toBe(false);
      game.endTurn();
      expect(game.isGameOver()).toBe(true);
    });

    it('should finish game when all stars are claimed', () => {
      // 星を21個使い切る（TRIPLE_MATCHで1個ずつ×21回）
      for (let i = 0; i < 21; i++) {
        const card = new Card(1, CardColor.RED);
        const card2 = new Card(1, CardColor.RED);
        const card3 = new Card(1, CardColor.RED);
        game.placeCard(card, { row: 0, col: 0 });
        game.placeCard(card2, { row: 0, col: 1 });
        game.placeCard(card3, { row: 0, col: 2 });
        const combo = new Combo(
          ComboType.TRIPLE_MATCH,
          [card, card2, card3],
          [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
        );
        game.claimCombo(combo);
      }

      expect(game.getTotalStars()).toBe(0);
      game.endTurn();
      expect(game.isGameOver()).toBe(true);
    });
  });

  describe('isGameOver and getWinner', () => {
    it('should not be over at start', () => {
      expect(game.isGameOver()).toBe(false);
      expect(game.getWinner()).toBeNull();
    });

    it('should determine winner by stars', () => {
      game.players[0].addStars(10);
      game.players[1].addStars(5);

      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }
      game.endTurn();

      expect(game.isGameOver()).toBe(true);
      expect(game.getWinner()).toBe(game.players[0]);
    });

    it('should return null for tie', () => {
      game.players[0].addStars(10);
      game.players[1].addStars(10);

      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }
      game.endTurn();

      expect(game.isGameOver()).toBe(true);
      expect(game.getWinner()).toBeNull();
    });
  });

  describe('full game scenario', () => {
    it('should handle a complete turn with THREE_CARDS combo', () => {
      const currentPlayer = game.getCurrentPlayer();
      const initialStars = currentPlayer.stars;
      const initialHandCount = currentPlayer.hand.getCardCount();

      const card1 = new Card(1, CardColor.RED);
      const card4 = new Card(4, CardColor.RED);
      const card16 = new Card(16, CardColor.RED);

      game.placeCard(card1, { row: 0, col: 0 });
      game.placeCard(card4, { row: 0, col: 1 });
      game.placeCard(card16, { row: 0, col: 2 });

      const combo = new Combo(
        ComboType.THREE_CARDS,
        [card1, card4, card16],
        [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
      );
      game.claimCombo(combo);

      expect(currentPlayer.stars).toBe(initialStars + 3);
      expect(currentPlayer.hand.getCardCount()).toBe(initialHandCount + 3);
      expect(game.board.isEmpty({ row: 0, col: 0 })).toBe(true);
      expect(game.board.isEmpty({ row: 0, col: 1 })).toBe(true);
      expect(game.board.isEmpty({ row: 0, col: 2 })).toBe(true);

      game.endTurn();
      expect(game.getCurrentPlayer()).toBe(game.players[1]);
    });

    it('should handle a complete turn with TRIPLE_MATCH combo', () => {
      const currentPlayer = game.getCurrentPlayer();
      const initialStars = currentPlayer.stars;
      const initialHandCount = currentPlayer.hand.getCardCount();

      const card9_1 = new Card(9, CardColor.BLUE);
      const card9_2 = new Card(9, CardColor.BLUE);
      const card9_3 = new Card(9, CardColor.BLUE);

      game.placeCard(card9_1, { row: 1, col: 0 });
      game.placeCard(card9_2, { row: 1, col: 1 });
      game.placeCard(card9_3, { row: 1, col: 2 });

      const combo = new Combo(
        ComboType.TRIPLE_MATCH,
        [card9_1, card9_2, card9_3],
        [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }]
      );
      game.claimCombo(combo);

      expect(currentPlayer.stars).toBe(initialStars + 1);
      expect(currentPlayer.hand.getCardCount()).toBe(initialHandCount + 1);
      expect(game.board.isEmpty({ row: 1, col: 0 })).toBe(true);
      expect(game.board.isEmpty({ row: 1, col: 1 })).toBe(true);
      expect(game.board.isEmpty({ row: 1, col: 2 })).toBe(true);

      game.endTurn();
      expect(game.getCurrentPlayer()).toBe(game.players[1]);
    });
  });

  describe('discardFromHand', () => {
    it('should discard a card from current player hand', () => {
      const currentPlayer = game.getCurrentPlayer();
      const card = currentPlayer.hand.getCards()[0];
      const initialHandCount = currentPlayer.hand.getCardCount();
      const initialDiscardPileCount = game.getDiscardPileCount();

      game.discardFromHand(card);

      expect(currentPlayer.hand.getCardCount()).toBe(initialHandCount - 1);
      expect(game.getDiscardPileCount()).toBe(initialDiscardPileCount + 1);
    });

    it('should throw error if game is finished', () => {
      // ゲームを終了状態にする
      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }
      game.endTurn();

      const card = game.getCurrentPlayer().hand.getCards()[0];
      expect(() => game.discardFromHand(card)).toThrow('Game is already finished');
    });
  });

  describe('drawAndPlaceCard', () => {
    it('should draw from deck and place on board', () => {
      const position = { row: 0, col: 0 };
      const initialDeckCount = game.deck.getCardCount();

      const drawnCard = game.drawAndPlaceCard(position);

      expect(drawnCard).not.toBeNull();
      expect(game.board.isEmpty(position)).toBe(false);
      expect(game.deck.getCardCount()).toBe(initialDeckCount - 1);
      expect(game.board.getCard(position)).toBe(drawnCard);
    });

    it('should throw error if position is not empty', () => {
      const position = { row: 0, col: 0 };
      const card = game.getCurrentPlayer().hand.getCards()[0];

      game.getCurrentPlayer().playCard(card);
      game.placeCard(card, position);

      expect(() => game.drawAndPlaceCard(position)).toThrow('Position is not empty');
    });

    it('should throw error if deck is empty', () => {
      const position = { row: 0, col: 0 };
      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }

      expect(() => game.drawAndPlaceCard(position)).toThrow('Deck is empty');
    });

    it('should throw error if game is finished', () => {
      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }
      game.endTurn();

      const position = { row: 0, col: 0 };
      expect(() => game.drawAndPlaceCard(position)).toThrow('Game is already finished');
    });
  });


  describe('endTurn - auto draw when hand is empty', () => {
    it('should auto draw 1 card when next player has no hand cards', () => {
      const game = Game.createNewGame();
      const player1 = game.players[0];

      // プレイヤー1の手札を全て使い切る
      const handCards = [...player1.hand.getCards()];
      handCards.forEach(card => {
        player1.playCard(card);
      });

      expect(player1.hand.hasCards()).toBe(false);
      const deckCountBefore = game.deck.getCardCount();

      // プレイヤー2のターンを終了してプレイヤー1のターンに戻る
      game.endTurn(); // player2のターン
      game.endTurn(); // player1のターンに戻る

      // プレイヤー1の手札に自動で1枚追加されているはず
      expect(player1.hand.getCardCount()).toBe(1);
      expect(game.deck.getCardCount()).toBe(deckCountBefore - 1);
    });

    it('should not auto draw when deck is empty', () => {
      const game = Game.createNewGame();
      const player1 = game.players[0];

      // 手札を空にする
      const handCards = [...player1.hand.getCards()];
      handCards.forEach(card => {
        player1.playCard(card);
      });

      // 山札を空にする
      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }

      expect(player1.hand.hasCards()).toBe(false);
      expect(game.deck.isEmpty()).toBe(true);

      game.endTurn();
      game.endTurn();

      // 手札は空のまま
      expect(player1.hand.hasCards()).toBe(false);
    });

    it('should not auto draw when player already has cards', () => {
      const game = Game.createNewGame();
      const player1 = game.players[0];

      expect(player1.hand.hasCards()).toBe(true);
      const handCountBefore = player1.hand.getCardCount();
      const deckCountBefore = game.deck.getCardCount();

      game.endTurn();
      game.endTurn();

      // 手札枚数は変わらない
      expect(player1.hand.getCardCount()).toBe(handCountBefore);
      expect(game.deck.getCardCount()).toBe(deckCountBefore);
    });

    it('should set auto draw flag when auto draw occurs', () => {
      const game = Game.createNewGame();
      const player1 = game.players[0];

      // 手札を空にする
      const handCards = [...player1.hand.getCards()];
      handCards.forEach(card => {
        player1.playCard(card);
      });

      game.endTurn(); // player2のターン
      expect(game.getLastAutoDrawnPlayerId()).toBeNull();

      game.endTurn(); // player1のターンに戻る

      // 自動ドローフラグが設定されているはず
      expect(game.getLastAutoDrawnPlayerId()).toBe('player1');

      // フラグをクリア
      game.clearAutoDrawFlag();
      expect(game.getLastAutoDrawnPlayerId()).toBeNull();
    });
  });

});
