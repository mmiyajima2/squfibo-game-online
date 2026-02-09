import { randomUUID } from 'crypto';
import type {
  GameStateDTO,
  PlayerDTO,
  CardDTO,
  BoardStateDTO,
  HandDTO,
  CardColor,
  CardValueType,
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
   * @param roomId 部屋ID
   * @param player1Id プレイヤー1のID
   * @param player2Id プレイヤー2のID
   * @returns 初期ゲーム状態
   */
  static createInitialGameState(
    roomId: string,
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
      gameState: 'PLAYING',
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
    const colors: CardColor[] = ['RED', 'BLUE'];

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
}
