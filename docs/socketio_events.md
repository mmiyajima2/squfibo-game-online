# Socket.io イベント仕様書

## 概要

本ドキュメントは、SquFiboオンライン対戦版におけるSocket.ioを用いたクライアント・サーバー間のリアルタイム通信仕様を定義します。

## 接続設定

- **Namespace**: `/game`
- **Transport**: WebSocket（フォールバック: polling）
- **接続タイムアウト**: 5秒
- **再接続試行**: 最大3回（指数バックオフ）

---

## イベント一覧

### クライアント → サーバー（Client to Server）

| イベント名 | 説明 |
|-----------|------|
| `createRoom` | 新しい対戦部屋を作成する |
| `joinRoom` | 既存の対戦部屋に参加する |
| `ready` | プレイヤーが準備完了を通知する |
| `removeCard` | 盤面満杯時にカードを除去する（ターン開始前） |
| `claimCombo` | 役の成立を申告する（カード配置＋役申告でターン確定） |
| `endTurn` | 役を申告せずにターンを終了する（カード配置＋ターン確定） |
| `leaveRoom` | 対戦部屋から退出する |

**注意:** カードの仮配置とキャンセルはクライアント側のみで処理し、サーバーには送信しません。

### サーバー → クライアント（Server to Client）

| イベント名 | 説明 |
|-----------|------|
| `roomCreated` | 部屋作成完了通知（URL情報含む） |
| `playerJoined` | プレイヤーが部屋に参加した通知 |
| `gameStart` | ゲーム開始通知 |
| `gameStateUpdate` | ゲーム状態の更新通知 |
| `cardRemoved` | カード除去完了通知 |
| `comboResolved` | 役成立・解決完了通知 |
| `turnEnded` | ターン終了通知（役申告なし） |
| `turnChanged` | ターン変更通知 |
| `gameFinished` | ゲーム終了通知 |
| `playerLeft` | プレイヤーが退出した通知 |
| `playerDisconnected` | プレイヤーが切断した通知 |
| `error` | エラー通知 |

---

## イベント詳細仕様

## 1. クライアント → サーバー

### 1.1 `createRoom`

新しい対戦部屋を作成します。

**ペイロード:**
```typescript
{
  playerName: string;  // プレイヤー名（1〜20文字）
}
```

**レスポンス:** `roomCreated` イベント

**エラーケース:**
- サーバーが混雑している場合: `SERVER_BUSY`
- バリデーションエラー: `INVALID_PLAYER_NAME`

---

### 1.2 `joinRoom`

既存の対戦部屋に参加します。

**ペイロード:**
```typescript
{
  roomId: string;      // 部屋ID（UUID v4）
  playerName: string;  // プレイヤー名（1〜20文字）
}
```

**レスポンス:** `playerJoined` イベント → `gameStart` イベント

**エラーケース:**
- 部屋が存在しない: `ROOM_NOT_FOUND`
- 部屋が満員: `ROOM_FULL`
- 既にゲームが開始されている: `GAME_ALREADY_STARTED`
- バリデーションエラー: `INVALID_ROOM_ID`, `INVALID_PLAYER_NAME`

---

### 1.3 `ready`

プレイヤーが準備完了したことを通知します（両プレイヤーがreadyになるとゲーム開始）。

**ペイロード:**
```typescript
{
  roomId: string;  // 部屋ID
}
```

**レスポンス:** （両者ready時）`gameStart` イベント

**エラーケース:**
- 部屋が存在しない: `ROOM_NOT_FOUND`
- プレイヤーが部屋に参加していない: `NOT_IN_ROOM`

---

### 1.4 `removeCard`

盤面が満杯の状態でターンを開始する際、1枚のカードを除去します。

**ペイロード:**
```typescript
{
  roomId: string;       // 部屋ID
  position: PositionDTO; // 除去するカードの位置
}
```

**レスポンス:** `cardRemoved` イベント → `gameStateUpdate` イベント

**エラーケース:**
- 部屋が存在しない: `ROOM_NOT_FOUND`
- 自分のターンではない: `NOT_YOUR_TURN`
- 盤面が満杯ではない: `BOARD_NOT_FULL`
- 指定位置にカードがない: `NO_CARD_AT_POSITION`
- 位置が盤面外: `INVALID_POSITION`

---

### 1.5 `claimCombo`

カードを配置し、役の成立を申告します。役が成立すればターンが確定し、カードが除去され、星とカードを獲得します。

**ペイロード:**
```typescript
{
  roomId: string;            // 部屋ID
  cardId: string | null;     // 配置するカードのID（手札から選択、null の場合は山札から自動ドロー）
  position: PositionDTO;     // 配置先の位置
  comboPositions: PositionDTO[]; // 役を構成するカードの位置配列（3個、配置したカードを含む）
}
```

**レスポンス:** `comboResolved` イベント → `gameStateUpdate` イベント → `turnChanged` イベント

**エラーケース:**
- 部屋が存在しない: `ROOM_NOT_FOUND`
- 自分のターンではない: `NOT_YOUR_TURN`
- 指定位置が空いていない: `CELL_NOT_EMPTY`
- カードIDが手札に存在しない: `CARD_NOT_IN_HAND`
- 手札が0枚なのにcardIdを指定している: `MUST_DRAW_FROM_DECK`
- 位置が盤面外: `INVALID_POSITION`
- 盤面が満杯: `BOARD_FULL` (先に `removeCard` が必要)
- 役が成立していない: `INVALID_COMBO`
- 配置したカードが役に含まれていない: `MUST_INCLUDE_PLACED_CARD`
- 指定位置にカードがない: `NO_CARD_AT_POSITIONS`
- カードが隣接していない: `CARDS_NOT_ADJACENT`
- カードの色が異なる: `CARDS_DIFFERENT_COLOR`
- 役の枚数が不正: `INVALID_COMBO_SIZE` (3枚である必要がある)

---

### 1.6 `endTurn`

カードを配置し、役を申告せずにターンを終了します。カードが確定し、次のプレイヤーのターンになります。

**ペイロード:**
```typescript
{
  roomId: string;        // 部屋ID
  cardId: string | null; // 配置するカードのID（手札から選択、null の場合は山札から自動ドロー）
  position: PositionDTO; // 配置先の位置
}
```

**レスポンス:** `turnEnded` イベント → `gameStateUpdate` イベント → `turnChanged` イベント

**エラーケース:**
- 部屋が存在しない: `ROOM_NOT_FOUND`
- 自分のターンではない: `NOT_YOUR_TURN`
- 指定位置が空いていない: `CELL_NOT_EMPTY`
- カードIDが手札に存在しない: `CARD_NOT_IN_HAND`
- 手札が0枚なのにcardIdを指定している: `MUST_DRAW_FROM_DECK`
- 位置が盤面外: `INVALID_POSITION`
- 盤面が満杯: `BOARD_FULL` (先に `removeCard` が必要)

---

### 1.7 `leaveRoom`

対戦部屋から退出します。

**ペイロード:**
```typescript
{
  roomId: string;  // 部屋ID
}
```

**レスポンス:** `playerLeft` イベント（対戦相手に通知）

**エラーケース:**
- 部屋が存在しない: `ROOM_NOT_FOUND`
- プレイヤーが部屋に参加していない: `NOT_IN_ROOM`

---

## 2. サーバー → クライアント

### 2.1 `roomCreated`

部屋作成が完了し、ホスト・ゲスト用のURLが生成されました。

**ペイロード:**
```typescript
{
  roomId: string;      // 部屋ID
  hostUrl: string;     // ホスト用URL
  guestUrl: string;    // ゲスト用URL
  playerId: string;    // ホストプレイヤーのID
  expiresAt: string;   // 部屋の有効期限（ISO 8601形式）
}
```

---

### 2.2 `playerJoined`

プレイヤーが部屋に参加しました。

**ペイロード:**
```typescript
{
  playerId: string;     // 参加したプレイヤーのID
  playerName: string;   // 参加したプレイヤーの名前
  playerCount: number;  // 現在の参加人数（1 or 2）
}
```

---

### 2.3 `gameStart`

両プレイヤーが揃い、ゲームが開始されました。

**ペイロード:**
```typescript
{
  gameState: GameStateDTO;  // 初期ゲーム状態
  yourPlayerId: string;     // 受信したクライアントのプレイヤーID
  yourPlayerIndex: 0 | 1;   // 受信したクライアントのプレイヤーインデックス
}
```

**GameStateDTO の詳細:**
```typescript
{
  gameId: string;
  board: BoardStateDTO;           // 盤面状態（3x3の2次元配列）
  players: [PlayerDTO, PlayerDTO]; // 2人のプレイヤー情報
  currentPlayerIndex: 0 | 1;      // 現在のターンプレイヤー
  deckCount: number;              // 山札の残り枚数
  discardPileCount: number;       // 捨て札の枚数
  totalStars: number;             // 場に残っている星の数
  gameState: GameState;           // PLAYING or FINISHED
  lastAutoDrawnPlayerId: string | null;    // 最後に自動ドローしたプレイヤーID
  lastPlacedPosition: PositionDTO | null;  // 最後に配置されたカードの位置
}
```

---

### 2.4 `gameStateUpdate`

ゲーム状態が更新されました。

**ペイロード:**
```typescript
{
  gameState: GameStateDTO;  // 更新後のゲーム状態
  updateType: 'card_placed' | 'card_removed' | 'combo_resolved' | 'turn_changed';
}
```

---

### 2.5 `cardRemoved`

盤面満杯時にカードが除去されました。

**ペイロード:**
```typescript
{
  playerId: string;      // 除去を実行したプレイヤーのID
  position: PositionDTO; // 除去された位置
  card: CardDTO;         // 除去されたカード
}
```

---

### 2.6 `comboResolved`

役が成立し、解決されました。カードが除去され、星とカードを獲得します。

**ペイロード:**
```typescript
{
  playerId: string;       // 役を申告したプレイヤーのID
  combo: ComboDTO;        // 成立した役の情報
  starsAwarded: number;   // 獲得した星の数
  cardsDrawn: number;     // ドローしたカードの枚数
}
```

**ComboDTO の詳細:**
```typescript
{
  type: ComboType;           // 'MAJOR' (大役) or 'MINOR' (小役)
  cards: CardDTO[];          // 役を構成するカード配列
  positions: PositionDTO[];  // 役を構成するカードの位置配列
}
```

---

### 2.7 `turnEnded`

役を申告せずにターンが終了しました。仮配置されたカードが確定します。

**ペイロード:**
```typescript
{
  playerId: string;      // ターンを終了したプレイヤーのID
  placedCard: CardDTO;   // 確定したカード
  position: PositionDTO; // 確定した位置
}
```

---

### 2.8 `turnChanged`

ターンが変わりました。

**ペイロード:**
```typescript
{
  currentPlayerIndex: 0 | 1;  // 新しいターンのプレイヤーインデックス
  currentPlayerId: string;    // 新しいターンのプレイヤーID
}
```

---

### 2.9 `gameFinished`

ゲームが終了しました。

**ペイロード:**
```typescript
{
  gameState: GameStateDTO;   // 最終ゲーム状態
  winner: {
    playerId: string;        // 勝者のプレイヤーID
    playerName: string;      // 勝者の名前
    stars: number;           // 勝者の星の数
  } | null;                  // null の場合は引き分け
  isDraw: boolean;           // 引き分けかどうか
  reason: 'ALL_STARS_CLAIMED' | 'DECK_EMPTY';  // 終了理由
}
```

---

### 2.10 `playerLeft`

プレイヤーが退出しました。

**ペイロード:**
```typescript
{
  playerId: string;      // 退出したプレイヤーのID
  playerName: string;    // 退出したプレイヤーの名前
}
```

---

### 2.11 `playerDisconnected`

プレイヤーが切断されました（30秒以内に再接続可能）。

**ペイロード:**
```typescript
{
  playerId: string;          // 切断したプレイヤーのID
  reconnectDeadline: string; // 再接続期限（ISO 8601形式）
}
```

---

### 2.12 `error`

エラーが発生しました。

**ペイロード:**
```typescript
{
  code: string;       // エラーコード（例: ROOM_NOT_FOUND, NOT_YOUR_TURN）
  message: string;    // エラーメッセージ（日本語）
  details?: any;      // 追加のエラー詳細（オプション）
}
```

**主なエラーコード一覧:**
- `SERVER_BUSY`: サーバーが混雑している
- `ROOM_NOT_FOUND`: 部屋が存在しない
- `ROOM_FULL`: 部屋が満員
- `GAME_ALREADY_STARTED`: ゲームが既に開始されている
- `NOT_IN_ROOM`: プレイヤーが部屋に参加していない
- `NOT_YOUR_TURN`: 自分のターンではない
- `CELL_NOT_EMPTY`: 指定位置が空いていない
- `CARD_NOT_IN_HAND`: カードが手札に存在しない
- `MUST_DRAW_FROM_DECK`: 手札が0枚の場合は山札からドローが必要
- `INVALID_POSITION`: 位置が盤面外
- `BOARD_FULL`: 盤面が満杯（先にカード除去が必要）
- `BOARD_NOT_FULL`: 盤面が満杯ではない
- `NO_CARD_AT_POSITION`: 指定位置にカードがない
- `INVALID_COMBO`: 役が成立していない
- `MUST_INCLUDE_PLACED_CARD`: 仮配置したカードが含まれていない
- `INVALID_COMBO_SIZE`: 役の枚数が不正（3枚である必要がある）
- `NO_CARD_AT_POSITIONS`: 指定位置にカードがない
- `CARDS_NOT_ADJACENT`: カードが隣接していない
- `CARDS_DIFFERENT_COLOR`: カードの色が異なる
- `INVALID_PLAYER_NAME`: プレイヤー名が不正
- `INVALID_ROOM_ID`: 部屋IDが不正

---

## 接続フロー

### フロー1: ホストが部屋を作成し、ゲストが参加する場合

```
[ホスト]                        [サーバー]                      [ゲスト]
   |                                |                               |
   |--- createRoom ---------------->|                               |
   |<-- roomCreated ----------------|                               |
   |   (hostUrl, guestUrlを取得)     |                               |
   |                                |                               |
   |  （guestUrlを友達に送る）        |                               |
   |                                |                               |
   |                                |<-- joinRoom ------------------|
   |<-- playerJoined ---------------|                               |
   |                                |--- playerJoined ------------->|
   |                                |                               |
   |--- ready --------------------->|                               |
   |                                |<-- ready ---------------------|
   |                                |                               |
   |<-- gameStart ------------------|--- gameStart ---------------->|
   |                                |                               |
```

### フロー2: ゲームプレイ（カード配置と役申告）

```
[プレイヤー1]                    [サーバー]                    [プレイヤー2]
   |                                |                               |
   |  （クライアント側で仮配置・       |                               |
   |   キャンセルを自由に繰り返す）     |                               |
   |                                |                               |
   |--- claimCombo ---------------->|                               |
   |  （配置情報+役申告）              |                               |
   |<-- comboResolved --------------|--- comboResolved ------------>|
   |<-- gameStateUpdate ------------|--- gameStateUpdate ---------->|
   |<-- turnChanged ----------------|--- turnChanged -------------->|
   |                                |                               |
```

### フロー2-2: カード配置後、役を申告せずターン終了

```
[プレイヤー1]                    [サーバー]                    [プレイヤー2]
   |                                |                               |
   |  （クライアント側で仮配置・       |                               |
   |   キャンセルを自由に繰り返す）     |                               |
   |                                |                               |
   |--- endTurn ------------------->|                               |
   |  （配置情報のみ）                 |                               |
   |<-- turnEnded ------------------|--- turnEnded ---------------->|
   |<-- gameStateUpdate ------------|--- gameStateUpdate ---------->|
   |<-- turnChanged ----------------|--- turnChanged -------------->|
   |                                |                               |
```

### フロー3: 盤面満杯時のカード除去

```
[プレイヤー]                     [サーバー]                    [相手プレイヤー]
   |                                |                               |
   |  （自分のターン開始時に盤面が満杯） |                               |
   |--- removeCard ---------------->|                               |
   |<-- cardRemoved ----------------|--- cardRemoved -------------->|
   |<-- gameStateUpdate ------------|--- gameStateUpdate ---------->|
   |                                |                               |
   |--- placeCard ----------------->|                               |
   |<-- cardPlaced -----------------|--- cardPlaced --------------->|
   |<-- gameStateUpdate ------------|--- gameStateUpdate ---------->|
   |                                |                               |
```

### フロー4: ゲーム終了

```
[プレイヤー1]                    [サーバー]                    [プレイヤー2]
   |                                |                               |
   |--- claimCombo ---------------->|                               |
   |  （これで星がすべて獲得される）    |                               |
   |<-- comboResolved --------------|--- comboResolved ------------>|
   |<-- gameFinished ---------------|--- gameFinished ------------->|
   |                                |                               |
```

---

## 実装上の注意点

### 1. セキュリティ

- すべてのイベントでroomIdとplayerIdを検証する
- ゲームロジックの検証はサーバー側で行う（クライアントを信頼しない）
- レート制限を実装し、スパム攻撃を防ぐ
- 部屋IDはUUID v4を使用し、推測困難にする

### 2. 状態同期

- サーバーがゲーム状態の唯一の正である（Authoritative Server）
- クライアントは楽観的UI更新を行い、サーバーからの確認で最終確定する
- 状態の不整合が発生した場合は、サーバーの状態を優先する

### 3. 再接続処理

- プレイヤーが切断した場合、30秒間は再接続を待つ
- 再接続時は、現在のゲーム状態を送信して同期する
- 30秒以内に再接続しない場合は、対戦相手の勝利として扱う

### 4. エラーハンドリング

- すべてのクライアントイベントでバリデーションを行う
- エラーが発生した場合は、`error` イベントで詳細を通知する
- クライアント側でエラーメッセージを適切に表示する

### 5. パフォーマンス

- ゲーム状態の送信は必要最小限にする
- Socket.ioのroomsを活用し、関係者のみにイベントを配信する
- Redisへの書き込みを最適化し、不要な書き込みを避ける

### 6. タイムアウト処理

- 部屋は作成から13分で自動的に削除される（Redis TTL）
- ゲーム終了時は明示的にRedisからデータを削除する
- 長時間操作がない場合のタイムアウト処理を実装する

---

## バージョン履歴

- **v1.0.0** (2026-02-07): 初版作成
