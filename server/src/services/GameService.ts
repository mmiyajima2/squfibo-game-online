import { randomUUID } from 'crypto';
import {
  GameState,
  CardColor,
  ComboType,
  type GameStateDTO,
  type PlayerDTO,
  type CardDTO,
  type BoardStateDTO,
  type CardValueType,
  type PositionDTO,
  type ComboDTO,
} from '@squfibo/shared';
import { getRedisClient } from './redisClient.js';

/**
 * ゲームサービス
 *
 * ゲーム状態の初期化と管理を行う
 */
export class GameService {
  /**
   * 初期ゲーム状態を作成
   *
   * @param _roomId 部屋ID（将来の拡張用）
   * @param player1Id プレイヤー1のID
   * @param player2Id プレイヤー2のID
   * @returns 初期ゲーム状態
   */
  static createInitialGameState(
    _roomId: string,
    player1Id: string,
    player2Id: string
  ): GameStateDTO {
    // デッキを生成してシャッフル
    const deck = this.createDeck();
    this.shuffleDeck(deck);

    // 各プレイヤーに8枚ずつ配布
    const player1Hand: CardDTO[] = [];
    const player2Hand: CardDTO[] = [];

    for (let i = 0; i < 8; i++) {
      const card1 = deck.pop();
      const card2 = deck.pop();
      if (card1) player1Hand.push(card1);
      if (card2) player2Hand.push(card2);
    }

    // 先攻をランダムに決定
    const firstPlayerIndex = Math.random() < 0.5 ? 0 : 1;

    // プレイヤー情報を作成
    const player1: PlayerDTO = {
      id: player1Id,
      stars: 0,
      hand: { cards: player1Hand },
    };

    const player2: PlayerDTO = {
      id: player2Id,
      stars: 0,
      hand: { cards: player2Hand },
    };

    // 空の盤面を生成
    const board: BoardStateDTO = {
      cells: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
    };

    // ゲーム状態を作成
    const gameState: GameStateDTO = {
      gameId: randomUUID(),
      board,
      players: [player1, player2],
      currentPlayerIndex: firstPlayerIndex,
      deckCount: deck.length,
      discardPileCount: 0,
      totalStars: 21,
      gameState: GameState.PLAYING,
      lastAutoDrawnPlayerId: null,
      lastPlacedPosition: null,
    };

    return gameState;
  }

  /**
   * デッキを作成
   *
   * カード構成:
   * - 1: 4枚 × 2色 = 8枚
   * - 4: 4枚 × 2色 = 8枚
   * - 9: 9枚 × 2色 = 18枚
   * - 16: 4枚 × 2色 = 8枚
   * 合計: 42枚
   */
  private static createDeck(): CardDTO[] {
    const cards: CardDTO[] = [];
    const cardConfig: Array<{ value: CardValueType; count: number }> = [
      { value: 1, count: 4 },
      { value: 4, count: 4 },
      { value: 9, count: 9 },
      { value: 16, count: 4 },
    ];
    const colors: CardColor[] = [CardColor.RED, CardColor.BLUE];

    for (const { value, count } of cardConfig) {
      for (const color of colors) {
        for (let i = 0; i < count; i++) {
          cards.push({
            id: randomUUID(),
            value,
            color,
          });
        }
      }
    }

    return cards;
  }

  /**
   * デッキをシャッフル（Fisher-Yates法）
   */
  private static shuffleDeck(deck: CardDTO[]): void {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  /**
   * ゲーム状態をRedisに保存
   */
  static async saveGameState(roomId: string, gameState: GameStateDTO): Promise<void> {
    const redis = getRedisClient();
    const key = `room:${roomId}:state`;

    // 部屋のTTLを取得
    const roomKey = `room:${roomId}:info`;
    const ttl = await redis.ttl(roomKey);

    if (ttl < 0) {
      throw new Error('Room has expired');
    }

    // ゲーム状態を保存（部屋と同じTTL）
    await redis.set(key, JSON.stringify(gameState), {
      EX: ttl,
    });
  }

  /**
   * ゲーム状態をRedisから取得
   */
  static async getGameState(roomId: string): Promise<GameStateDTO | null> {
    const redis = getRedisClient();
    const key = `room:${roomId}:state`;
    const data = await redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as GameStateDTO;
  }

  /**
   * 盤面が満杯かどうかをチェック
   */
  static isBoardFull(board: BoardStateDTO): boolean {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board.cells[row][col] === null) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 位置が有効かどうかをチェック
   */
  static isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < 3 && col >= 0 && col < 3;
  }

  /**
   * 指定位置のカードを取得
   */
  static getCardAt(board: BoardStateDTO, row: number, col: number): CardDTO | null {
    if (!this.isValidPosition(row, col)) {
      return null;
    }
    return board.cells[row][col];
  }

  /**
   * 盤面からカードを除去
   */
  static removeCardFromBoard(
    gameState: GameStateDTO,
    row: number,
    col: number
  ): CardDTO | null {
    if (!this.isValidPosition(row, col)) {
      return null;
    }

    const card = gameState.board.cells[row][col];
    if (!card) {
      return null;
    }

    // カードを除去して捨て札に追加
    gameState.board.cells[row][col] = null;
    gameState.discardPileCount += 1;

    return card;
  }

  /**
   * カードを盤面に配置
   */
  static placeCardOnBoard(
    gameState: GameStateDTO,
    card: CardDTO,
    row: number,
    col: number
  ): boolean {
    if (!this.isValidPosition(row, col)) {
      return false;
    }

    if (gameState.board.cells[row][col] !== null) {
      return false;
    }

    gameState.board.cells[row][col] = card;
    gameState.lastPlacedPosition = { row, col };
    return true;
  }

  /**
   * 手札からカードを削除
   */
  static removeCardFromHand(player: PlayerDTO, cardId: string): CardDTO | null {
    const cardIndex = player.hand.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      return null;
    }

    const [card] = player.hand.cards.splice(cardIndex, 1);
    return card;
  }

  /**
   * 山札からカードをドロー
   * @returns ドローしたカード数
   */
  static drawCardsFromDeck(
    gameState: GameStateDTO,
    player: PlayerDTO,
    count: number
  ): number {
    let drawnCount = 0;

    for (let i = 0; i < count && gameState.deckCount > 0; i++) {
      // 実際のカードデッキから引くロジックはシンプルに
      // deckCountを減らして、プレイヤーの手札に新しいカードを追加
      const newCard: CardDTO = this.drawSingleCardFromDeck();
      player.hand.cards.push(newCard);
      gameState.deckCount -= 1;
      drawnCount++;
    }

    return drawnCount;
  }

  /**
   * 山札から1枚ドロー
   */
  static drawSingleCardFromDeck(): CardDTO {
    // 簡易実装：ランダムなカードを生成
    // 実際のゲームでは、デッキの状態を保持する必要がありますが、
    // 現在の仕様ではdeckCountのみを管理しているため、ランダム生成で対応
    const values: CardValueType[] = [1, 4, 9, 16];
    const colors: CardColor[] = [CardColor.RED, CardColor.BLUE];

    const value = values[Math.floor(Math.random() * values.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return {
      id: randomUUID(),
      value,
      color,
    };
  }

  /**
   * 役の判定
   * @returns 成立した役情報、または null
   */
  static validateCombo(
    board: BoardStateDTO,
    positions: PositionDTO[],
    placedPosition: PositionDTO
  ): ComboDTO | null {
    // 基本チェック
    if (positions.length !== 3) {
      return null;
    }

    // 配置したカードが役に含まれているかチェック
    const includesPlacedCard = positions.some(
      (pos) => pos.row === placedPosition.row && pos.col === placedPosition.col
    );
    if (!includesPlacedCard) {
      return null;
    }

    // カードを取得
    const cards: CardDTO[] = [];
    for (const pos of positions) {
      const card = this.getCardAt(board, pos.row, pos.col);
      if (!card) {
        return null; // カードが存在しない
      }
      cards.push(card);
    }

    // 色が全て同じかチェック
    const firstColor = cards[0].color;
    if (!cards.every((card) => card.color === firstColor)) {
      return null;
    }

    // カードが隣接しているかチェック
    if (!this.areCardsAdjacent(positions)) {
      return null;
    }

    // 役のタイプを判定
    const values = cards.map((c) => c.value).sort((a, b) => a - b);

    // 大役チェック: 1 + 4 + 16 = 21
    if (values[0] === 1 && values[1] === 4 && values[2] === 16) {
      return {
        type: ComboType.THREE_CARDS,
        cards,
        positions,
      };
    }

    // 小役チェック: 同じ数字3枚
    if (values[0] === values[1] && values[1] === values[2]) {
      return {
        type: ComboType.TRIPLE_MATCH,
        cards,
        positions,
      };
    }

    return null;
  }

  /**
   * カードが隣接しているかチェック
   * 3枚のカードが縦横に連なっているか（L字、縦一列、横一列）
   */
  static areCardsAdjacent(positions: PositionDTO[]): boolean {
    if (positions.length !== 3) {
      return false;
    }

    // 各カードが少なくとも1つの他のカードに隣接している必要がある
    // かつ、全体が連結している必要がある

    // 隣接判定関数
    const isAdjacent = (p1: PositionDTO, p2: PositionDTO): boolean => {
      const rowDiff = Math.abs(p1.row - p2.row);
      const colDiff = Math.abs(p1.col - p2.col);
      return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    };

    // 各カードから少なくとも1つの他のカードへの隣接があるかチェック
    const adjacencyCount = positions.map((p1, i) => {
      let count = 0;
      positions.forEach((p2, j) => {
        if (i !== j && isAdjacent(p1, p2)) {
          count++;
        }
      });
      return count;
    });

    // L字型または一列の場合、隣接数は [1, 2, 1] または [2, 1, 1] などになる
    // 少なくとも1つが2つ以上と隣接し、残りが1つ以上と隣接している必要がある
    const hasCenter = adjacencyCount.some((count) => count === 2);
    const allConnected = adjacencyCount.every((count) => count >= 1);

    return hasCenter && allConnected;
  }

  /**
   * 盤面から複数のカードを除去
   */
  static removeCardsFromBoard(
    gameState: GameStateDTO,
    positions: PositionDTO[]
  ): CardDTO[] {
    const removedCards: CardDTO[] = [];

    for (const pos of positions) {
      const card = this.removeCardFromBoard(gameState, pos.row, pos.col);
      if (card) {
        removedCards.push(card);
      }
    }

    return removedCards;
  }

  /**
   * ターンを変更
   */
  static changeTurn(gameState: GameStateDTO): void {
    gameState.currentPlayerIndex = gameState.currentPlayerIndex === 0 ? 1 : 0;
  }

  /**
   * ゲーム終了判定
   * @returns 終了理由、または null（継続）
   */
  static checkGameEnd(
    gameState: GameStateDTO
  ): 'ALL_STARS_CLAIMED' | 'DECK_EMPTY' | null {
    // 星がすべて獲得された
    if (gameState.totalStars <= 0) {
      return 'ALL_STARS_CLAIMED';
    }

    // 山札が空
    if (gameState.deckCount <= 0) {
      return 'DECK_EMPTY';
    }

    return null;
  }

  /**
   * 勝者を判定
   * @returns 勝者のプレイヤーインデックス、または null（引き分け）
   */
  static determineWinner(gameState: GameStateDTO): number | null {
    const player1Stars = gameState.players[0].stars;
    const player2Stars = gameState.players[1].stars;

    if (player1Stars > player2Stars) {
      return 0;
    } else if (player2Stars > player1Stars) {
      return 1;
    } else {
      return null; // 引き分け
    }
  }

  /**
   * 相手の手札情報をマスク
   * 指定したプレイヤー以外の手札内容を隠します（枚数のみ保持）
   *
   * @param gameState ゲーム状態
   * @param viewerPlayerId 閲覧者のプレイヤーID
   * @returns マスクされたゲーム状態（Deep copy）
   */
  static maskOpponentHand(gameState: GameStateDTO, viewerPlayerId: string): GameStateDTO {
    // Deep copyを作成
    const maskedState: GameStateDTO = JSON.parse(JSON.stringify(gameState));

    // 各プレイヤーの手札をチェック
    maskedState.players = maskedState.players.map((player) => {
      if (player.id !== viewerPlayerId) {
        // 相手プレイヤーの場合：手札の枚数だけ保持し、内容は隠す（有効なダミー値を使用）
        const handCount = player.hand.cards.length;
        return {
          ...player,
          hand: {
            cards: new Array(handCount).fill(null).map(() => ({
              id: 'hidden',
              value: 1 as CardValueType, // 有効なカード値を使用（実際の値は見えないので何でもOK）
              color: CardColor.RED,
            })),
          },
        };
      }
      return player;
    }) as [PlayerDTO, PlayerDTO];

    return maskedState;
  }
}
