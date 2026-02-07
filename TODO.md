# タスク

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