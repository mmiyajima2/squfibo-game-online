# 要点
## 物理設計
* VPS (RAM: 2GB, CPU: 2core)程度の1台を想定
* サーバーサイドは、expressjs, socket.ioをつかう
* redisを状態保存用に使う
* 今できているブラウザゲームのリポジトリはそのまま残す
* 新たにリポジトリをオンライン対戦版として用意し現存を活かしながらオンライン版フロントエンドとして改造する
 
## 論理設計
* 認証は不要で対戦部屋を作成できる
* ホストURLとゲストURLを生成するのでゲストURLを友達に送って対戦する
* 対戦部屋の最大時間を13分とする


## 設計の補足
* オンライン対戦版はCPU対戦を提供しない
* 既存のclient側コードはCPU対戦のロジックがあるがこれは削除してシンプルする

# Claudeからのアドバイス

以下の内容は叩き台としての参考情報であり、開発を進めるなかで変更しうる。

## 1. プロジェクト構造の設計

### 推奨ディレクトリ構造
```
squfibo-game-online/
├── client/                 # 既存のReact/TypeScriptコードをベースに
│   ├── src/
│   │   ├── components/    # 既存のゲームコンポーネント
│   │   ├── hooks/         # Socket.io接続用のカスタムフック
│   │   ├── services/      # API・Socket通信層
│   │   └── types/         # 共通の型定義
│   └── package.json
├── server/                 # 新規作成
│   ├── src/
│   │   ├── socket/        # Socket.ioイベントハンドラ
│   │   ├── services/      # ゲームロジック・Redis操作
│   │   ├── models/        # データモデル
│   │   └── utils/         # ユーティリティ
│   └── package.json
└── shared/                 # 型定義やゲームロジックを共有
    └── types.ts
```

## 2. 実装ステップ（優先順位順）

### Phase 1: 基礎インフラの構築
1. **サーバーセットアップ**
   - Express + Socket.io サーバーの初期化
   - Redisクライアントの接続設定
   - CORS設定（クライアントからの接続を許可）

2. **対戦部屋管理システム**
   - 部屋ID生成ロジック（UUID v4推奨）
   - HostURL/GuestURLの生成
   - Redisでの部屋情報管理（TTL: 13分設定）

### Phase 2: Socket.ioイベント設計
```typescript
// クライアント → サーバー
- 'create-room': 部屋作成
- 'join-room': 部屋参加
- 'ready': プレイヤー準備完了
- 'game-action': ゲーム操作（カード配置など）
- 'leave-room': 退室

// サーバー → クライアント
- 'room-created': 部屋作成完了（URLs返却）
- 'player-joined': 相手参加通知
- 'game-start': ゲーム開始
- 'game-state-update': ゲーム状態更新
- 'opponent-action': 相手の操作
- 'game-end': ゲーム終了
- 'opponent-disconnected': 相手切断
```

### Phase 3: フロントエンド改造
1. **Socket接続カスタムフック作成**
   ```typescript
   // useSocket.ts
   const useSocket = (roomId?: string) => {
     const socket = useRef<Socket>();
     // 接続管理・再接続ロジック
   }
   ```

2. **既存ゲームロジックの分離**
   - ローカルゲーム用とオンライン用でコンポーネントを分岐
   - 状態管理をSocket経由の更新に対応

3. **UI追加要素**
   - ルーム作成画面
   - URL共有画面
   - 待機画面（相手待ち）
   - 接続状態インジケータ

### Phase 4: ゲーム状態同期
1. **楽観的UI更新**
   - 自分の操作は即座に画面反映
   - サーバーからの確認で最終確定

2. **競合解決**
   - サーバー側でゲーム状態を正として管理
   - クライアントは表示のみに徹する（authoritative server）

## 3. Redis データ構造設計

### 推奨キー設計
```
room:{roomId}:state        # ゲーム状態全体（JSON）
room:{roomId}:players      # プレイヤー情報（Hash）
room:{roomId}:host         # ホストSocket ID
room:{roomId}:guest        # ゲストSocket ID
room:{roomId}:created_at   # 作成時刻
```

### TTL設定
- すべてのキーに780秒（13分）のTTL
- ゲーム終了時に明示的に削除

## 4. 重要な実装ポイント

### セキュリティ
- Socket.ioのnamespace使用（例: `/game`）
- 部屋IDの推測困難性（UUID v4）
- レート制限（express-rate-limit）
- 入力バリデーション（Zod等）

### パフォーマンス
- Redisへの書き込みは必要最小限に
- ゲーム状態の差分更新（全体送信を避ける）
- Socket.ioのroomsを活用した効率的なブロードキャスト

### エラーハンドリング
- Redis接続エラー時のフォールバック
- Socket切断時の再接続ロジック（30秒猶予）
- タイムアウト処理（13分経過で自動終了）

### UX改善
- ローディング状態の明示
- 接続品質インジケータ（ping表示）
- 切断時の復帰オプション
- エラーメッセージの多言語対応

## 5. デプロイメント

### VPS環境設定
```bash
# Node.js LTS インストール
# Redis インストール
# PM2でプロセス管理
# Nginxでリバースプロキシ（WebSocket対応）
```

### 監視
- PM2のモニタリング
- Redis メモリ使用量監視
- アクティブな対戦部屋数のログ

## 6. 段階的移行プラン

1. **既存リポジトリのクローン**
   - 新リポジトリ作成
   - クライアントコードを `client/` に配置

2. **サーバー開発（ローカル環境）**
   - Express + Socket.io + Redis で基本動作確認
   - モックデータで通信テスト

3. **クライアント改造（ローカル環境）**
   - Socket接続機能追加
   - 既存ゲームとの統合

4. **統合テスト**
   - 2つのブラウザで対戦テスト
   - 切断・再接続シナリオテスト

5. **VPSデプロイ**
   - 本番環境セットアップ
   - CI/CDパイプライン構築（GitHub Actions推奨）

## 7. 次のアクションアイテム

- [x] 新リポジトリ `squfibo-game-online` 作成
- [x] サーバーディレクトリ初期化（Express + Socket.io + Redis）
- [x] 共通型定義ファイルの作成
- [ ] Socket.ioイベント仕様書の作成
- [ ] Redis接続テスト用スクリプト作成
- [ ] クライアント側Socket接続フック実装

まずは Phase 1 の「基礎インフラの構築」から始めることをお勧めします。

