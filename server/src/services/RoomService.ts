import { randomUUID } from 'crypto';
import { getRedisClient } from './redisClient.js';

/**
 * 部屋の情報
 */
export interface RoomInfo {
  roomId: string;
  hostPlayerId: string;
  hostPlayerName: string;
  guestPlayerId: string | null;
  guestPlayerName: string | null;
  hostSocketId: string;
  guestSocketId: string | null;
  createdAt: string;
  expiresAt: string;
  status: 'WAITING' | 'READY' | 'PLAYING' | 'FINISHED';
}

const ROOM_TTL_SECONDS = 780; // 13分

/**
 * Room管理サービス
 */
export class RoomService {
  /**
   * 新しい部屋を作成
   */
  static async createRoom(
    hostPlayerName: string,
    hostSocketId: string,
    baseUrl: string
  ): Promise<{
    roomId: string;
    hostUrl: string;
    guestUrl: string;
    playerId: string;
    expiresAt: string;
  }> {
    const redis = getRedisClient();
    const roomId = randomUUID();
    const hostPlayerId = randomUUID();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + ROOM_TTL_SECONDS * 1000).toISOString();

    const roomInfo: RoomInfo = {
      roomId,
      hostPlayerId,
      hostPlayerName,
      guestPlayerId: null,
      guestPlayerName: null,
      hostSocketId,
      guestSocketId: null,
      createdAt,
      expiresAt,
      status: 'WAITING',
    };

    // Redisに保存
    const key = `room:${roomId}:info`;
    await redis.set(key, JSON.stringify(roomInfo), {
      EX: ROOM_TTL_SECONDS,
    });

    // URLを生成
    const hostUrl = `${baseUrl}/room/${roomId}?role=host`;
    const guestUrl = `${baseUrl}/room/${roomId}?role=guest`;

    return {
      roomId,
      hostUrl,
      guestUrl,
      playerId: hostPlayerId,
      expiresAt,
    };
  }

  /**
   * 部屋の情報を取得
   */
  static async getRoomInfo(roomId: string): Promise<RoomInfo | null> {
    const redis = getRedisClient();
    const key = `room:${roomId}:info`;
    const data = await redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as RoomInfo;
  }

  /**
   * 部屋の情報を更新
   */
  static async updateRoomInfo(roomId: string, roomInfo: RoomInfo): Promise<void> {
    const redis = getRedisClient();
    const key = `room:${roomId}:info`;

    // TTLを取得
    const ttl = await redis.ttl(key);
    if (ttl < 0) {
      throw new Error('Room has expired');
    }

    // 更新して既存のTTLを維持
    await redis.set(key, JSON.stringify(roomInfo), {
      EX: ttl,
    });
  }

  /**
   * 部屋を削除
   */
  static async deleteRoom(roomId: string): Promise<void> {
    const redis = getRedisClient();
    const keys = [
      `room:${roomId}:info`,
      `room:${roomId}:state`,
    ];

    await redis.del(keys);
  }

  /**
   * 部屋が存在するかチェック
   */
  static async roomExists(roomId: string): Promise<boolean> {
    const redis = getRedisClient();
    const key = `room:${roomId}:info`;
    const exists = await redis.exists(key);
    return exists === 1;
  }
}
