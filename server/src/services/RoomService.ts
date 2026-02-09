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
  hostReady: boolean;
  guestReady: boolean;
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
      hostReady: false,
      guestReady: false,
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

  /**
   * 部屋に参加する（ゲスト専用）
   * 注: ホストはcreateRoom時に自動的に部屋に参加するため、このメソッドはゲストのみが使用します
   */
  static async joinRoom(
    roomId: string,
    playerName: string,
    socketId: string
  ): Promise<{
    playerId: string;
    roomInfo: RoomInfo;
  }> {
    // 部屋の情報を取得
    const roomInfo = await this.getRoomInfo(roomId);

    if (!roomInfo) {
      throw new Error('ROOM_NOT_FOUND');
    }

    // 部屋のステータスチェック
    if (roomInfo.status !== 'WAITING') {
      throw new Error('ROOM_NOT_AVAILABLE');
    }

    // ゲストとして参加
    if (roomInfo.guestPlayerId !== null) {
      throw new Error('ROOM_FULL');
    }

    const guestPlayerId = randomUUID();
    roomInfo.guestPlayerId = guestPlayerId;
    roomInfo.guestPlayerName = playerName;
    roomInfo.guestSocketId = socketId;

    await this.updateRoomInfo(roomId, roomInfo);

    return {
      playerId: guestPlayerId,
      roomInfo,
    };
  }

  /**
   * プレイヤーを準備完了にする
   *
   * @param roomId 部屋ID
   * @param playerId プレイヤーID
   * @returns 両プレイヤーが準備完了した場合true
   */
  static async markPlayerReady(
    roomId: string,
    playerId: string
  ): Promise<{
    bothReady: boolean;
    roomInfo: RoomInfo;
  }> {
    const roomInfo = await this.getRoomInfo(roomId);

    if (!roomInfo) {
      throw new Error('ROOM_NOT_FOUND');
    }

    // プレイヤーが部屋に参加しているかチェック
    const isHost = roomInfo.hostPlayerId === playerId;
    const isGuest = roomInfo.guestPlayerId === playerId;

    if (!isHost && !isGuest) {
      throw new Error('NOT_IN_ROOM');
    }

    // 準備完了フラグを設定
    if (isHost) {
      roomInfo.hostReady = true;
    } else {
      roomInfo.guestReady = true;
    }

    // 両プレイヤーが準備完了かチェック
    const bothReady = roomInfo.hostReady && roomInfo.guestReady;

    // 両プレイヤーが準備完了した場合、ステータスをREADYに更新
    if (bothReady) {
      roomInfo.status = 'READY';
    }

    await this.updateRoomInfo(roomId, roomInfo);

    return {
      bothReady,
      roomInfo,
    };
  }

  /**
   * 部屋のステータスをPLAYINGに更新
   */
  static async setRoomPlaying(roomId: string): Promise<void> {
    const roomInfo = await this.getRoomInfo(roomId);

    if (!roomInfo) {
      throw new Error('ROOM_NOT_FOUND');
    }

    roomInfo.status = 'PLAYING';
    await this.updateRoomInfo(roomId, roomInfo);
  }
}
