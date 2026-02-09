# タスク

## [✓] server側で「盤面満杯時にカードを除去する（ターン開始前）」イベントを実装してほしい
- ✅ server側だけでよい
- ✅ ./shared/ にあるソースを参考にすること

### 実装内容
- `server/src/socket/eventTypes.ts` - `CardRemovedPayload`型定義追加
- `server/src/services/GameService.ts` - ボード操作メソッド追加
  - `isBoardFull`: 盤面が満杯かチェック
  - `isValidPosition`: 位置が有効かチェック
  - `getCardAt`: 指定位置のカードを取得
  - `removeCardFromBoard`: 盤面からカードを除去
- `server/src/socket/index.ts` - `removeCard`イベントハンドラー実装
  - バリデーション（roomId、position、ターンプレイヤー、盤面満杯チェック）
  - カード除去処理
  - `cardRemoved`イベントと`gameStateUpdate`イベントの送信
- `server/test-client/test-driver.html` - `removeCard`イベントのテスト対応
  - フォーム追加（部屋ID、行、列）
  - イベントリスナー追加（cardRemoved、gameStateUpdate）

## [✓] 仕様書 `./docs/socketio_events.md` について「プレイヤーが準備完了を通知する」の仕様を相談したい
- ✅ 準備完了のイベントをserver側で受け取ってゲームが開始される理解である
- ✅ この時、どちらが先攻かをパラメータとして送る必要はないだろうか？
- ~~意見をこの見出しのサブ項目に記載してほしい~~
- ✅ server側について、「プレイヤーが準備完了を通知する」の実装をしてほしい
- ✅ 先攻の決め方は、推奨のアプローチAを前提としてよい

### 実装内容

- `server/src/socket/eventTypes.ts` - `GameStartPayload`型定義追加
  - gameState: GameStateDTO
  - yourPlayerId: string
  - yourPlayerIndex: 0 | 1
- `server/src/services/GameService.ts` - ゲーム初期化サービス（新規作成）
  - createInitialGameState: ゲームの初期状態を生成
  - createDeck: 標準デッキ（42枚）を生成
  - shuffleDeck: Fisher-Yates法でシャッフル
  - saveGameState: ゲーム状態をRedisに保存
  - getGameState: ゲーム状態をRedisから取得
- `server/src/services/RoomService.ts` - 準備状態管理機能追加
  - RoomInfoに`hostReady`、`guestReady`フィールド追加
  - markPlayerReady: プレイヤーを準備完了にする
  - setRoomPlaying: 部屋のステータスをPLAYINGに更新
- `server/src/socket/index.ts` - readyイベントハンドラー実装
  - バリデーション（roomId、プレイヤーが部屋に参加しているか）
  - socket.idからplayerIdを特定
  - RoomService.markPlayerReadyを呼び出し
  - 両プレイヤーがreadyになったらGameService.createInitialGameStateを実行
  - ゲーム状態をRedisに保存
  - 各プレイヤーに個別の`gameStart`イベントを送信（yourPlayerIdとyourPlayerIndexを設定）
- `server/test-client/test-driver.html` - readyイベントのテスト対応
  - 未実装マークを削除
  - gameStartイベントのリスナーを追加

### ゲームの初期化仕様

- **デッキ構成**: 1×4枚、4×4枚、9×9枚、16×4枚（各色RED、BLUE）= 合計42枚
- **初期配布**: 各プレイヤー8枚ずつ
- **先攻決定**: サーバー側でランダム（Math.random() < 0.5）
- **初期盤面**: 3x3の空盤面
- **初期星数**: 21個

### Claudeの意見

#### 1. 先攻・後攻の決定方法について

**現在の仕様:**
- `ready`イベントではroomIdのみを送信
- 両プレイヤーがreadyになると、サーバーが`gameStart`イベントを送信
- `gameStart`に含まれる`currentPlayerIndex`で先攻プレイヤーが決定される

**先攻・後攻をパラメータで送る必要性の検討:**

##### アプローチA: サーバー側でランダム決定（推奨）
**メリット:**
- シンプルで実装が容易
- 公平性が保証される（完全なランダム）
- クライアント側のロジックが不要
- 悪意のあるクライアントによる不正が防げる

**実装イメージ:**
```typescript
// サーバー側
const firstPlayerIndex = Math.random() < 0.5 ? 0 : 1;
```

##### アプローチB: クライアントから先攻・後攻を指定
**メリット:**
- プレイヤー間で事前に決めた順番を反映できる（じゃんけんなど）
- ホストを常に先攻にするなど、明示的なルール適用が可能

**デメリット:**
- 両プレイヤーが先攻を主張した場合の調整ロジックが必要
- 実装が複雑になる
- ホストが常に有利な選択をする可能性（公平性の問題）

**実装イメージ:**
```typescript
// readyイベントのペイロード
{
  roomId: string;
  wantFirstTurn?: boolean;  // 先攻を希望するか（オプション）
}

// サーバー側の調整ロジック
if (両者が先攻希望 || 両者が後攻希望) {
  // ランダムで決定
} else {
  // 希望に従う
}
```

##### アプローチC: ホストが決定権を持つ
**メリット:**
- 部屋を作った人が順番を決められる
- UI設計がシンプル（ホストのみに選択肢を表示）

**デメリット:**
- ホストが有利（常に先攻を選ぶ可能性）
- ゲストの意見が反映されない

#### 2. 推奨案

**推奨: アプローチA（サーバー側でランダム決定）**

理由：
1. **公平性**: 完全にランダムで、どちらのプレイヤーも有利・不利がない
2. **シンプル**: クライアント側で何も指定する必要がなく、実装が簡潔
3. **セキュリティ**: クライアント側の不正な操作を防げる
4. **現在の仕様との整合性**: `ready`イベントは既にroomIdのみの設計になっており、変更不要

**将来的な拡張案:**
もし「プレイヤーが先攻・後攻を選びたい」という要望があれば、以下のような段階的な実装も可能：
1. まずは完全ランダムで実装
2. 将来的に「フレンドマッチ設定」として、ホストが先攻・後攻・ランダムを選べる機能を追加

**結論:**
現時点では`ready`イベントにパラメータを追加する必要はなく、サーバー側でランダムに先攻・後攻を決定する方式を推奨します。

## [✓] server側、「既存の対戦部屋に参加する」を実装してほしい
- ✅ server側だけでよい
- ✅ 今使っているserver側実装を試すテスト用ドライバを、全てのイベントで利用できるよう汎用的にしてほしい

### 実装内容
- `server/src/socket/eventTypes.ts` - `RoomJoinedPayload`型定義追加
- `server/src/services/RoomService.ts` - `joinRoom`メソッド実装（ゲスト専用）
  - 部屋の存在チェック
  - ステータスチェック（WAITING状態のみ参加可能）
  - 満室チェック（guestPlayerIdがnullかどうか）
  - ゲスト情報の登録と部屋情報の更新
- `server/src/socket/index.ts` - イベントハンドラー実装
  - **createRoom**: ホストを自動的にSocket.IOルームに参加させる
  - **joinRoom**: ゲスト専用のイベントハンドラー
    - バリデーション（roomId、playerName）
    - Socket.IOルームへの参加
    - `roomJoined`イベントの送信
    - `playerJoined`イベントのブロードキャスト（ホストに通知）
    - エラーハンドリング（ROOM_NOT_FOUND、ROOM_FULL、ROOM_NOT_AVAILABLE）

### 設計方針
- **ホスト**: `createRoom`イベントで部屋を作成すると同時に自動的に部屋に参加（Socket.IOルームにjoin）
- **ゲスト**: `joinRoom`イベントで明示的に部屋に参加する必要がある
- この設計により、ホストは部屋作成後すぐにリアルタイム通信が可能

### テストドライバの汎用化
- `server/test-client/test-driver.html` - 汎用イベントテストドライバー（新規作成）
  - イベント選択機能（createRoom、joinRoom、その他）
  - イベント別の動的フォーム表示
  - 汎用的な結果表示（JSON形式）
  - リアルタイム接続状態表示
  - レスポンシブデザイン
- `server/test-client/test-join-room.js` - joinRoom専用テストスクリプト（新規作成）
- `server/test-client/test-event-generic.js` - 汎用イベントテストスクリプト（新規作成）
  - 任意のイベント名とペイロードJSONを受け取る
  - 全てのSocket.IOイベントをテスト可能
- `server/test-client/README.md` - ドキュメント更新
  - 汎用テストドライバーの使い方
  - テストシナリオ例
  - トラブルシューティング

### テスト項目
- ✅ `joinRoom`イベントの送信
- ✅ `roomJoined`イベントの受信
- ✅ `playerJoined`イベントのブロードキャスト
- ✅ 部屋の存在チェック
- ✅ 満室チェック
- ✅ 部屋情報の更新

## [x] server側、「新しい対戦部屋を作成する」について、疑問を解消しておきたい
- 対戦部屋として発行されるホスト/ゲストURLは、フロント側の画面処理で部屋に入るかどうかを尋ねるボタンを用意する想定\
そのようなユースケースを前提として動作は可能か？
- 部屋に入ったあとは、その部屋はホストとゲストの2人しか入れないようにする必要がある、その設計は考慮されているか？
- ホストとゲストが部屋に入ったらその2人以外は部屋にアクセスできないようにする、\
その考慮を今後実装に組み込むのは容易か？
- 意見をこの見出しのサブ項目に記載してほしい

### Claude意見

#### 1. ホスト/ゲストURLでフロント側のボタン処理は可能か？
**回答: 可能です**

現在の実装では、部屋作成時に以下のURLを生成しています：
- ホストURL: `{baseUrl}/room/{roomId}?role=host`
- ゲストURL: `{baseUrl}/room/{roomId}?role=guest`

フロント側での想定フロー：
1. URLアクセス時に「部屋に入る」ボタンを表示
2. ボタンクリック時に Socket.IO で `joinRoom` イベントを送信
3. サーバー側で部屋への参加処理を実行

この設計は問題なく動作します。URL生成の段階では Socket 接続せず、ユーザーの明示的なアクション（ボタンクリック）で接続する方式は一般的なパターンです。

#### 2. 部屋に2人しか入れない設計は考慮されているか？
**回答: 考慮されています**

`RoomService.ts` の `RoomInfo` 型定義を見ると：
```typescript
{
  hostPlayerId: string;
  guestPlayerId: string | null;
  hostSocketId: string;
  guestSocketId: string | null;
  status: 'WAITING' | 'READY' | 'PLAYING' | 'FINISHED';
}
```

- ホストとゲスト専用のフィールドが明確に分離
- `guestPlayerId` が null の場合は「ゲスト待ち」、設定済みの場合は「満室」と判定可能
- `status` フィールドで部屋の状態管理が可能

この設計により、2人専用の部屋として制御できる構造になっています。

#### 3. 3人目以降のアクセスを拒否する実装は容易か？
**回答: 容易です**

今後 `joinRoom` イベントを実装する際、以下のロジックで簡単に制御できます：

```typescript
// 疑似コード
const roomInfo = await RoomService.getRoomInfo(roomId);
if (role === 'guest' && roomInfo.guestPlayerId !== null) {
  return error('この部屋は満室です');
}
if (roomInfo.status !== 'WAITING') {
  return error('この部屋は既に開始されています');
}
```

**実装のポイント：**
- `guestPlayerId` の null チェックで満室判定
- `status` フィールドで部屋の状態チェック
- Redis の TTL 機能により13分で自動削除されるため、リソースリークの心配なし

**結論：** 現在の設計は2人専用部屋の要件を満たしており、追加実装も容易です。

## [✓] server側について、一つのイベントに限り実装してほしい
- ✅ 「新しい対戦部屋を作成する」の部分だけでよい
- ✅ redisにデータを保存することろまでやってほしい
- ✅ その他のイベントの実装はまだしなくてよい
- ✅ client側の改造も現段階では考慮しなくてよい
- ✅ ./shared/以下にあるソースは利用すること
- ✅ ./shared/以下のソースが使いづらい、足りない場合は追加・修正してよい
- ✅ 部屋作成だけ試せるテスト用のシンプルなHTML+JS（ドライバ）もほしい

### 実装内容
- `server/src/services/redisClient.ts` - Redisクライアント管理
- `server/src/services/RoomService.ts` - 部屋管理サービス
- `server/src/socket/eventTypes.ts` - Socket.IOイベント型定義
- `server/src/socket/index.ts` - `createRoom`イベントハンドラー実装
- `server/src/server.ts` - Redis初期化・グレースフルシャットダウン
- `server/test-client/index.html` - テスト用HTMLクライアント
- `server/test-client/test-create-room.js` - Node.jsテストスクリプト
- `server/test-client/test-validation.js` - バリデーションテストスクリプト

### テスト結果
- ✅ 部屋作成機能が正常に動作
- ✅ Redisへのデータ保存（TTL: 780秒）
- ✅ プレイヤー名のバリデーション（1〜20文字）
- ✅ エラーハンドリング（INVALID_PLAYER_NAME等）
- ✅ ホストURL・ゲストURLの生成