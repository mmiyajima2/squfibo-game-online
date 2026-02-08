# タスク

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