# SquFibo Game Server

SquFiboゲームのバックエンドサーバーです。Express.js、Socket.IO、Redisを使用して実装されています。

## 技術スタック

- **フレームワーク**: Express.js
- **リアルタイム通信**: Socket.IO
- **データストア**: Redis
- **言語**: TypeScript
- **テスト**: Vitest

## ディレクトリ構造

```
server/
├── src/
│   ├── server.ts           # エントリーポイント
│   ├── app.ts              # Expressアプリケーション
│   ├── socket/             # Socket.IOハンドラー
│   │   └── index.ts
│   ├── services/           # ビジネスロジック
│   ├── models/             # データモデル
│   └── utils/              # ユーティリティ関数
├── dist/                   # ビルド出力 (ルート.gitignore)
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## セットアップ

### 前提条件

- Node.js 18.x 以上
- Redis (ローカル環境または Docker)

### インストール

```bash
# 依存関係をインストール
npm install

# 環境変数ファイルを作成
cp .env.example .env
```

### 環境変数

`.env`ファイルを作成し、以下の変数を設定してください：

```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 開発方法

```bash
# 開発サーバーを起動 (ホットリロード有効)
npm run dev

# ビルド
npm run build

# プロダクションモードで起動
npm start

# テストを実行
npm run test

# テストをウォッチモードで実行
npm run test:watch

# テストUIを起動
npm run test:ui

# リンターを実行
npm run lint
```

## テスト

このプロジェクトではVitestを使用した単体テストを実装しています。

### テストファイルの配置

- テストファイルは`*.test.ts`という命名規則で作成します
- ソースコードと同じディレクトリに配置します（例：`src/utils/helper.ts` → `src/utils/helper.test.ts`）

### テストの実行

```bash
# すべてのテストを実行
npm run test

# ウォッチモードで実行
npm run test:watch

# UIモードで実行
npm run test:ui
```

## API エンドポイント

### ヘルスチェック

```
GET /health
```

レスポンス例：
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T09:00:00.000Z"
}
```

## Socket.IO イベント

### クライアント → サーバー

（実装予定）

### サーバー → クライアント

（実装予定）

## ライセンス

MIT
