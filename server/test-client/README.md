# SquFibo 部屋作成テストクライアント

このディレクトリには、Socket.IOの`createRoom`イベントをテストするためのシンプルなHTML+JSクライアントが含まれています。

## 使い方

1. サーバーを起動します:
   ```bash
   cd server
   npm run dev
   ```

2. Redisが起動していることを確認します:
   ```bash
   redis-cli ping
   # "PONG" が返ってくれば OK
   ```

3. ブラウザで `index.html` を開きます:
   - ファイルを直接ブラウザにドラッグ&ドロップ、または
   - 簡易HTTPサーバーを使用する場合:
     ```bash
     cd server/test-client
     npx http-server -p 8080
     ```
     その後、ブラウザで `http://localhost:8080` を開きます

4. テストクライアントで以下を実行:
   - サーバーURLを確認（デフォルト: `http://localhost:3000`）
   - プレイヤー名を入力（1〜20文字）
   - 「部屋を作成」ボタンをクリック

5. 成功すると、以下の情報が表示されます:
   - 部屋ID
   - プレイヤーID
   - ホストURL
   - ゲストURL
   - 有効期限

## 確認事項

- [x] Socket.IOサーバーへの接続
- [x] `createRoom`イベントの送信
- [x] `roomCreated`イベントの受信
- [x] Redisへのデータ保存
- [x] バリデーションエラーのハンドリング
- [x] エラーレスポンスの表示

## Redisデータの確認

作成された部屋のデータはRedisに保存されます。以下のコマンドで確認できます:

```bash
# 全てのキーを表示
redis-cli KEYS "room:*"

# 特定の部屋の情報を取得
redis-cli GET "room:{roomId}:info"

# TTLを確認
redis-cli TTL "room:{roomId}:info"
```

## トラブルシューティング

### サーバーに接続できない

- サーバーが起動しているか確認してください
- サーバーのポートが3000であることを確認してください
- CORS設定が正しいか確認してください

### Redisエラーが発生する

- Redisが起動しているか確認してください:
  ```bash
  redis-cli ping
  ```
- Redis URLが正しいか確認してください（デフォルト: `redis://localhost:6379`）

### 部屋が作成されない

- ブラウザのコンソール（開発者ツール）でエラーを確認してください
- サーバーのログを確認してください
- プレイヤー名が1〜20文字であることを確認してください
