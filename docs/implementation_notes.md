# 実装ノート

## 2026-02-07: `createRoom`イベントの実装

### 概要
Socket.IOを使用した部屋作成機能を実装しました。クライアントから`createRoom`イベントを受信し、Redisに部屋情報を保存します。

### 実装したファイル

#### 1. Redis関連
- **server/src/services/redisClient.ts**
  - Redisクライアントの初期化・接続管理
  - シングルトンパターンで実装
  - 環境変数`REDIS_URL`でRedis接続先を設定可能（デフォルト: `redis://localhost:6379`）

#### 2. Room管理
- **server/src/services/RoomService.ts**
  - 部屋の作成・取得・更新・削除機能を提供
  - UUID v4による部屋ID・プレイヤーIDの生成
  - ホストURL・ゲストURLの生成
  - Redisキー: `room:{roomId}:info`
  - TTL: 780秒（13分）

  **RoomInfo型:**
  ```typescript
  {
    roomId: string;
    hostPlayerId: string;
    hostPlayerName: string;
    guestPlayerId: string | null;
    guestPlayerName: string | null;
    hostSocketId: string;
    guestSocketId: string | null;
    createdAt: string;  // ISO 8601
    expiresAt: string;  // ISO 8601
    status: 'WAITING' | 'READY' | 'PLAYING' | 'FINISHED';
  }
  ```

#### 3. Socket.IO関連
- **server/src/socket/eventTypes.ts**
  - Socket.IOイベントの型定義
  - `CreateRoomPayload`, `RoomCreatedPayload`, `ErrorPayload`等

- **server/src/socket/index.ts**
  - `createRoom`イベントハンドラーの実装
  - プレイヤー名のバリデーション（1〜20文字）
  - エラーハンドリング
  - callbackとイベント両方でレスポンスを返す

#### 4. サーバー初期化
- **server/src/server.ts**
  - Redis初期化処理の追加
  - グレースフルシャットダウン（SIGTERM, SIGINT）
  - エラーハンドリング

### イベント仕様

#### createRoom（クライアント → サーバー）
**ペイロード:**
```typescript
{
  playerName: string;  // 1〜20文字
}
```

**レスポンス（成功時）:**
```typescript
{
  roomId: string;      // UUID v4
  hostUrl: string;     // "http://localhost:5173/room/{roomId}?role=host"
  guestUrl: string;    // "http://localhost:5173/room/{roomId}?role=guest"
  playerId: string;    // UUID v4
  expiresAt: string;   // ISO 8601形式
}
```

**レスポンス（エラー時）:**
```typescript
{
  code: string;        // "INVALID_PLAYER_NAME" | "SERVER_ERROR"
  message: string;     // エラーメッセージ（日本語）
  details?: any;       // 追加のエラー詳細
}
```

### バリデーション

#### プレイヤー名
- 必須フィールド
- 型: string
- 長さ: 1〜20文字（trimされた後）
- エラーコード: `INVALID_PLAYER_NAME`

### テスト

#### テストクライアント
1. **HTMLクライアント** (`server/test-client/index.html`)
   - ブラウザから直接テスト可能
   - Socket.IO CDNを使用（v4.8.2）
   - UIで部屋作成結果を確認可能

2. **Node.jsテストスクリプト**
   - `test-create-room.js`: 部屋作成の正常系テスト
   - `test-validation.js`: バリデーションエラーのテスト

#### テスト実行方法
```bash
# サーバー起動
cd server
npm run dev

# 別ターミナルで
# Node.jsテスト実行
node test-client/test-create-room.js
node test-client/test-validation.js

# HTMLテスト実行
open test-client/index.html
```

#### テスト結果（2026-02-07）
- ✅ 部屋作成が正常に動作
- ✅ Redisへのデータ保存確認
- ✅ TTL（780秒）が正しく設定される
- ✅ プレイヤー名のバリデーションが動作
- ✅ エラーハンドリングが正しく機能

### Redisデータ構造

#### キー: `room:{roomId}:info`
- 型: String（JSON）
- TTL: 780秒（13分）
- 値: RoomInfo型のJSON文字列

#### 確認コマンド
```bash
# 全部屋のキー一覧
redis-cli KEYS "room:*"

# 特定の部屋情報取得
redis-cli GET "room:{roomId}:info"

# TTL確認
redis-cli TTL "room:{roomId}:info"
```

### 環境変数

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| PORT | 3000 | サーバーポート |
| CLIENT_URL | http://localhost:5173 | クライアントURL（CORS・URL生成用） |
| REDIS_URL | redis://localhost:6379 | Redis接続URL |

### 今後の実装予定

次のステップとして、以下のイベントを実装する必要があります：

1. **joinRoom** - 部屋参加
2. **ready** - プレイヤー準備完了
3. **removeCard** - カード除去
4. **claimCombo** - 役申告
5. **endTurn** - ターン終了
6. **leaveRoom** - 部屋退出

また、以下の機能も必要です：
- ゲーム状態の管理（GameStateService）
- プレイヤー切断時の処理
- 再接続処理
- タイムアウト処理

### 参考資料
- [Socket.IO イベント仕様書](./socketio_events.md)
- [オンライン設計](./online_design.md)
- [ゲーム仕様書](./game_spec_ja.md)
