Task
----

# [x] Socket.io　のイベント仕様書の叩き台を作成してほしい
* ./docs/ 以下に日本語で作成してほしい
* ./shared/ 以下に必要そうな型を準備したので参考にしてほしい
* 完了: ./docs/socketio_events.md を作成しました

# [ ] redisをデータストアとして活用するために必要な設計を教えてほしい
* 私は、RDBMS以外のデータストアを使った経験はすくない
* 今回の要件では、RDBMSよりもkey-value型の方が適当だとは理解している
* すでに、ドメイン層の方は /shared に用意している理解である
* ER図を作るような、論理設計をどうするのかアドバイスがほしい
* アドバイスはこの見出しの、サブ項目として記載してほしい

## Claudeの意見

### 1. Redis（key-value型）とRDBMSの設計アプローチの違い

**RDBMS（正規化中心）:**
- データの整合性と冗長性排除を重視
- ER図で「エンティティ間の関係」を設計
- JOINで複数テーブルを結合してデータを取得

**Redis（アクセスパターン中心）:**
- **アクセスパターンを先に決める**ことが設計の出発点
- データの取得・更新がどのように行われるかを最優先に考える
- 冗長性は許容し、読み取りを高速化する
- 「どのデータをどんな単位で読み書きするか」でキー設計が決まる

### 2. SquFiboにおけるアクセスパターンの特定

Socket.IO仕様書と既存のドメインモデルから、以下のアクセスパターンが必要です：

#### パターン1: 部屋の作成・参加
- 部屋IDから部屋の基本情報を取得
- プレイヤーが参加しているか確認
- 部屋の有効期限を確認

#### パターン2: ゲーム開始
- ゲーム状態全体を初期化
- プレイヤー2人分の情報を保存
- 山札、盤面、手札を初期化

#### パターン3: ゲームプレイ中（高頻度）
- **ゲーム状態全体を取得・更新**（カード配置、役申告など）
- プレイヤーの手札を取得・更新
- 盤面の状態を取得・更新
- 現在のターンプレイヤーを確認・変更

#### パターン4: Socket接続管理
- Socket IDからプレイヤーIDと部屋IDを逆引き
- プレイヤーの接続状態を確認

#### パターン5: 部屋のクリーンアップ
- ゲーム終了時に部屋関連データを削除
- TTL切れで自動削除

### 3. 推奨Redisデータ構造設計

#### 3-1. キー命名規則

```
# 命名パターン: {prefix}:{entity}:{id}:{field}
# 例: room:abc123:game, room:abc123:meta

# メリット:
# - キーの階層構造が明確
# - DEL room:abc123:* のようなパターン削除が可能
# - Redisの論理的グルーピングが容易
```

#### 3-2. 具体的なキー設計

##### A. 部屋のメタ情報（Hash）
```
キー: room:{roomId}:meta
データ構造: Hash
TTL: 780秒（13分）

フィールド:
- roomId: string          # 部屋ID（UUID v4）
- hostPlayerId: string    # ホストプレイヤーID
- guestPlayerId: string   # ゲストプレイヤーID（未参加時はnull）
- hostSocketId: string    # ホストのSocket ID
- guestSocketId: string   # ゲストのSocket ID（未参加時はnull）
- createdAt: string       # 作成日時（ISO 8601）
- expiresAt: string       # 有効期限（ISO 8601）
- status: string          # 'WAITING' | 'READY' | 'PLAYING' | 'FINISHED'

選択理由:
- 1つの部屋の基本情報は常に一緒に読み書きされる
- Hashは複数フィールドをまとめて取得・更新できる（HGETALL, HMSET）
- メモリ効率が良い（小さいHashはziplistで最適化される）
```

##### B. ゲーム状態（String - JSON）
```
キー: room:{roomId}:game
データ構造: String（JSONシリアライズ）
TTL: 780秒（13分）

内容: GameStateDTO 全体（Socket.IO仕様書に定義済み）
{
  gameId: string,
  board: BoardStateDTO,           # 3x3盤面
  players: [PlayerDTO, PlayerDTO], # 2人のプレイヤー
  currentPlayerIndex: 0 | 1,
  deckCount: number,
  discardPileCount: number,
  totalStars: number,
  gameState: 'PLAYING' | 'FINISHED',
  lastAutoDrawnPlayerId: string | null,
  lastPlacedPosition: PositionDTO | null
}

選択理由:
- ゲーム状態は「常に全体を取得して全体を更新する」ため、JSON一括保存が最適
- 部分更新するとデータ不整合のリスクが高まる
- Socket.IOで送信するGameStateDTOと1対1対応するため扱いやすい
- GET/SETの2操作だけで完結し、シンプル
```

##### C. Socket ID → Room ID 逆引き（String）
```
キー: socket:{socketId}:room
データ構造: String
TTL: 780秒（13分）

内容: roomId

選択理由:
- Socket切断時に「どの部屋に所属していたか」を即座に特定する必要がある
- 1対1の単純なマッピングなのでStringで十分
```

##### D. Socket ID → Player ID 逆引き（String）
```
キー: socket:{socketId}:player
データ構造: String
TTL: 780秒（13分）

内容: playerId

選択理由:
- イベントハンドラで「誰からのリクエストか」を即座に特定する必要がある
- 1対1の単純なマッピング
```

##### E. アクティブな部屋一覧（Set - オプション）
```
キー: rooms:active
データ構造: Set
TTL: なし（手動管理）

内容: roomId の集合

選択理由:
- 統計情報やモニタリングに使用（オプション機能）
- 部屋作成時に SADD、削除時に SREM
- SCARD でアクティブな部屋数をO(1)で取得可能
```

#### 3-3. データ構造の選択理由まとめ

| データ構造 | 使用箇所 | 理由 |
|----------|---------|------|
| **Hash** | 部屋メタ情報 | 複数の関連フィールドをまとめて管理、部分更新可能 |
| **String (JSON)** | ゲーム状態 | 複雑なネストしたオブジェクト、常に全体を読み書き |
| **String** | Socket逆引き | 単純な1対1マッピング |
| **Set** | アクティブ部屋 | 重複排除、集合演算、O(1)の存在確認 |

### 4. 「ER図」に相当するRedisの設計図

RDBMSのER図に相当するものとして、以下の図を参考にしてください：

```
┌─────────────────────────────────────────────────────┐
│ room:{roomId}:meta (Hash)                           │
│ ┌─────────────────────────────────────────────────┐ │
│ │ roomId: "abc123"                                │ │
│ │ hostPlayerId: "p1"                              │ │
│ │ guestPlayerId: "p2"                             │ │
│ │ hostSocketId: "socket-xxx"                      │ │
│ │ guestSocketId: "socket-yyy"                     │ │
│ │ createdAt: "2026-02-07T..."                     │ │
│ │ expiresAt: "2026-02-07T..."                     │ │
│ │ status: "PLAYING"                               │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                    ↓ 1対1
┌─────────────────────────────────────────────────────┐
│ room:{roomId}:game (String/JSON)                    │
│ ┌─────────────────────────────────────────────────┐ │
│ │ {                                               │ │
│ │   gameId: "abc123",                             │ │
│ │   board: { cells: [[...], [...], [...]] },     │ │
│ │   players: [                                    │ │
│ │     { id, name, hand, stars, ... },             │ │
│ │     { id, name, hand, stars, ... }              │ │
│ │   ],                                            │ │
│ │   currentPlayerIndex: 0,                        │ │
│ │   deckCount: 30,                                │ │
│ │   ...                                           │ │
│ │ }                                               │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

                    ↑ 参照
┌─────────────────────────────────────────────────────┐
│ socket:{socketId}:room (String)                     │
│ 内容: "abc123"                                       │
└─────────────────────────────────────────────────────┘
                    +
┌─────────────────────────────────────────────────────┐
│ socket:{socketId}:player (String)                   │
│ 内容: "p1"                                           │
└─────────────────────────────────────────────────────┘
```

**関係性:**
- 1つの `room:{roomId}:meta` に対して、1つの `room:{roomId}:game` が存在（1対1）
- 各Socketに対して、逆引きキーが存在（多対1で部屋を参照）
- TTLは全て同じ値（780秒）を設定し、同時に削除される

### 5. 実装時の注意点とベストプラクティス

#### 5-1. トランザクション処理

Redisでは複数キーの更新を原子的に行うため、**MULTIコマンド（Redisトランザクション）** を使用します：

```typescript
// 例: 部屋作成時に複数キーを同時に作成
const multi = redisClient.multi();
multi.hSet(`room:${roomId}:meta`, { /* ... */ });
multi.set(`room:${roomId}:game`, JSON.stringify(gameState));
multi.expire(`room:${roomId}:meta`, 780);
multi.expire(`room:${roomId}:game`, 780);
await multi.exec();
```

#### 5-2. TTL管理

- 全ての関連キーに同じTTLを設定（部屋単位で一括削除される）
- ゲーム終了時は明示的に `DEL room:{roomId}:*` で削除
- TTL切れはRedisが自動で行うが、明示的削除の方が確実

#### 5-3. エラーハンドリング

```typescript
// ゲーム状態が存在しない場合の処理
const gameStateJson = await redisClient.get(`room:${roomId}:game`);
if (!gameStateJson) {
  throw new Error('ROOM_NOT_FOUND');
}
const gameState = JSON.parse(gameStateJson);
```

#### 5-4. パフォーマンス最適化

- **Pipeline**: 複数のGETを並列実行
  ```typescript
  const pipeline = redisClient.pipeline();
  pipeline.get(`room:${roomId}:game`);
  pipeline.hGetAll(`room:${roomId}:meta`);
  const [gameState, meta] = await pipeline.exec();
  ```

- **冗長化は許容**: Socket逆引きキーは冗長だが、検索速度のために必要

### 6. 次のステップ

1. **Redis接続モジュールの実装** (`server/src/services/redis.ts`)
   - Redis Clientの初期化
   - 接続エラーハンドリング
   - 再接続ロジック

2. **データアクセス層の実装** (`server/src/services/roomService.ts`)
   - 部屋の作成・取得・削除
   - ゲーム状態の保存・取得・更新
   - Socket逆引き処理

3. **Socket.IOイベントハンドラとの統合**
   - 各イベントで適切なRedis操作を呼び出す
   - エラーハンドリングとロールバック処理

この設計であれば、2GBのRAMで100〜200の同時対戦を十分に処理できます。