import { Board } from './entities/Board';
import { Deck } from './entities/Deck';
import { Player } from './entities/Player';
import { Card } from './entities/Card';
import type { Position } from 'squfibo-shared';
import { Combo } from './services/Combo';
import type { GameStateDTO } from 'squfibo-shared';

export enum GameState {
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

export class Game {
  private lastAutoDrawnPlayerId: string | null = null;
  private lastPlacedPosition: Position | null = null;

  private constructor(
    public readonly board: Board,
    public readonly deck: Deck,
    public readonly players: [Player, Player],
    private currentPlayerIndex: 0 | 1,
    private totalStars: number,
    private discardPile: Card[],
    private gameState: GameState
  ) {}

  static createNewGame(playerGoesFirst: boolean = true): Game {
    const deck = Deck.createInitialDeck();
    deck.shuffle();

    const player1 = new Player('player1');
    const player2 = new Player('player2');

    for (let i = 0; i < 8; i++) {
      const card1 = deck.draw();
      const card2 = deck.draw();
      if (card1) player1.drawToHand(card1);
      if (card2) player2.drawToHand(card2);
    }

    return new Game(
      new Board(),
      deck,
      [player1, player2],
      playerGoesFirst ? 0 : 1,
      21,
      [],
      GameState.PLAYING
    );
  }

  /**
   * サーバーから受け取ったGameStateDTOからGameオブジェクトを構築
   */
  static fromServerState(gameStateDTO: GameStateDTO): Game {
    // Boardの構築
    const board = new Board();
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cardDTO = gameStateDTO.board.cells[row][col];
        if (cardDTO) {
          const card = new Card(cardDTO.value, cardDTO.color, cardDTO.id);
          board.placeCard(card, { row, col });
        }
      }
    }

    // Deckの構築（カード枚数のみを管理）
    // 注: サーバーはdeckCountのみを送信するため、実際のカード内容は不要
    // 空のデッキを作成し、カウントは外部で管理
    const deck = new Deck([]);

    // Playersの構築
    const player1 = new Player(gameStateDTO.players[0].id);
    player1.setStars(gameStateDTO.players[0].stars);
    const cards1 = gameStateDTO.players[0].hand.cards.map(
      cardDTO => new Card(cardDTO.value, cardDTO.color, cardDTO.id)
    );
    player1.hand.setCards(cards1);

    const player2 = new Player(gameStateDTO.players[1].id);
    player2.setStars(gameStateDTO.players[1].stars);
    const cards2 = gameStateDTO.players[1].hand.cards.map(
      cardDTO => new Card(cardDTO.value, cardDTO.color, cardDTO.id)
    );
    player2.hand.setCards(cards2);

    // Gameオブジェクトの構築
    const game = new Game(
      board,
      deck,
      [player1, player2],
      gameStateDTO.currentPlayerIndex,
      gameStateDTO.totalStars,
      [], // discardPileは復元不要（カウントのみサーバーが管理）
      gameStateDTO.gameState === 'PLAYING' ? GameState.PLAYING : GameState.FINISHED
    );

    // lastAutoDrawnPlayerIdを復元
    if (gameStateDTO.lastAutoDrawnPlayerId) {
      game['lastAutoDrawnPlayerId'] = gameStateDTO.lastAutoDrawnPlayerId;
    }

    // lastPlacedPositionを復元
    if (gameStateDTO.lastPlacedPosition) {
      game['lastPlacedPosition'] = gameStateDTO.lastPlacedPosition;
    }

    return game;
  }

  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  getOpponent(): Player {
    return this.players[this.currentPlayerIndex === 0 ? 1 : 0];
  }

  placeCard(card: Card, position: Position): void {
    if (this.gameState === GameState.FINISHED) {
      throw new Error('Game is already finished');
    }

    if (!this.board.isEmpty(position)) {
      throw new Error('Position is not empty');
    }

    this.board.placeCard(card, position);
    this.lastPlacedPosition = position;
  }

  discardFromBoard(position: Position): void {
    const card = this.board.removeCard(position);
    if (card) {
      this.discardPile.push(card);
    }
  }

  discardFromHand(card: Card): void {
    if (this.gameState === GameState.FINISHED) {
      throw new Error('Game is already finished');
    }

    const currentPlayer = this.getCurrentPlayer();
    const discardedCard = currentPlayer.playCard(card);
    this.discardPile.push(discardedCard);
  }

  drawAndPlaceCard(position: Position): Card | null {
    if (this.gameState === GameState.FINISHED) {
      throw new Error('Game is already finished');
    }

    if (!this.board.isEmpty(position)) {
      throw new Error('Position is not empty');
    }

    if (this.deck.isEmpty()) {
      throw new Error('Deck is empty');
    }

    const drawnCard = this.deck.draw();
    if (drawnCard) {
      this.board.placeCard(drawnCard, position);
      this.lastPlacedPosition = position;
    }
    return drawnCard;
  }

  claimCombo(combo: Combo): boolean {
    if (this.gameState === GameState.FINISHED) {
      return false;
    }

    const currentPlayer = this.getCurrentPlayer();

    // カードを除去（役のカードのみ）
    for (const position of combo.positions) {
      const card = this.board.removeCard(position);
      if (card) {
        this.discardPile.push(card);
      }
    }

    // カードをドロー（役に応じた枚数）
    const drawCount = combo.getDrawCount();
    for (let i = 0; i < drawCount; i++) {
      if (this.deck.isEmpty()) {
        break;
      }
      const drawnCard = this.deck.draw();
      if (drawnCard) {
        currentPlayer.drawToHand(drawnCard);
      }
    }

    // 星を獲得（役に応じた個数）
    const starsToAward = Math.min(combo.getRewardStars(), this.totalStars);
    currentPlayer.addStars(starsToAward);
    this.totalStars -= starsToAward;

    return true;
  }

  endTurn(): void {
    // ゲーム終了判定
    // 1. 全ての星が配布された
    // 2. 山札が空
    if (this.totalStars === 0 || this.deck.isEmpty()) {
      this.gameState = GameState.FINISHED;
    }

    this.currentPlayerIndex = this.currentPlayerIndex === 0 ? 1 : 0;

    // ターン開始時の自動ドロー
    if (this.gameState !== GameState.FINISHED) {
      const nextPlayer = this.getCurrentPlayer();
      if (!nextPlayer.hand.hasCards() && !this.deck.isEmpty()) {
        const drawnCard = this.deck.draw();
        if (drawnCard) {
          nextPlayer.drawToHand(drawnCard);
          this.lastAutoDrawnPlayerId = nextPlayer.id;
        }
      }
    }
  }

  isGameOver(): boolean {
    return this.gameState === GameState.FINISHED;
  }

  getWinner(): Player | null {
    if (!this.isGameOver()) {
      return null;
    }

    const [player1, player2] = this.players;
    if (player1.stars > player2.stars) {
      return player1;
    } else if (player2.stars > player1.stars) {
      return player2;
    }
    return null;
  }

  getTotalStars(): number {
    return this.totalStars;
  }

  getDiscardPileCount(): number {
    return this.discardPile.length;
  }

  getGameState(): GameState {
    return this.gameState;
  }

  getLastAutoDrawnPlayerId(): string | null {
    return this.lastAutoDrawnPlayerId;
  }

  clearAutoDrawFlag(): void {
    this.lastAutoDrawnPlayerId = null;
  }

  getLastPlacedPosition(): Position | null {
    return this.lastPlacedPosition;
  }
}
