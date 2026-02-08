# タスク

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