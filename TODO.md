タスク
-----

# [x] サーバー用のディレクトリを初期化してほしい
- 単体テストコードの配置を考慮すること
- 必要なモジュール・ライブラリがあればインストールしてよい
- 対応概要をこの見出しのサブ階階に記載してほしい

## 対応内容

### 作成したファイル

1. **設定ファイル**
   - `server/package.json` - npm依存関係とスクリプト定義
   - `server/tsconfig.json` - TypeScriptコンパイラ設定
   - `server/vitest.config.ts` - Vitestテストフレームワーク設定
   - `server/eslint.config.js` - ESLint設定
   - `server/.env.example` - 環境変数のサンプル
   - ※ `.gitignore`はルートディレクトリで一元管理

2. **ソースコード**
   - `server/src/server.ts` - サーバーエントリーポイント（HTTP + Socket.IO）
   - `server/src/app.ts` - Expressアプリケーション設定
   - `server/src/socket/index.ts` - Socket.IOイベントハンドラー
   - `server/src/app.test.ts` - サンプルテストファイル

3. **ドキュメント**
   - `server/README.md` - サーバーのセットアップとAPIドキュメント

### インストールした依存関係

**本番環境用**
- `express` (v4.21.2) - Webフレームワーク
- `socket.io` (v4.8.2) - リアルタイム双方向通信
- `redis` (v4.7.1) - データストア
- `cors` (v2.8.5) - CORS対応

**開発環境用**
- `typescript` (~5.9.3) - TypeScript
- `tsx` (v4.19.2) - TypeScript実行環境（開発時のホットリロード）
- `vitest` (v4.0.18) - テストフレームワーク
- `@vitest/ui` (v4.0.18) - テストUIツール
- `eslint` + `typescript-eslint` - リンター
- `@types/*` - 型定義ファイル

### ディレクトリ構造

```
server/
├── src/
│   ├── server.ts           # エントリーポイント
│   ├── app.ts              # Expressアプリケーション
│   ├── app.test.ts         # サンプルテスト
│   ├── socket/             # Socket.IOハンドラー
│   │   └── index.ts
│   ├── services/           # ビジネスロジック（既存）
│   ├── models/             # データモデル（既存）
│   └── utils/              # ユーティリティ（既存）
├── dist/                   # ビルド出力（ルート.gitignore）
├── node_modules/           # 依存関係（ルート.gitignore）
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.js
├── .env.example
└── README.md
```

### テストの配置方針

- テストファイルは`*.test.ts`という命名規則で作成
- ソースコードと同じディレクトリに配置（例：`utils/helper.ts` → `utils/helper.test.ts`）
- Vitestをテストフレームワークとして採用（クライアントと統一）
- グローバル環境でテストを実行（`globals: true`）

### 利用可能なnpmスクリプト

```bash
npm run dev          # 開発サーバー起動（ホットリロード）
npm run build        # TypeScriptビルド
npm start            # プロダクション起動
npm run test         # テスト実行
npm run test:watch   # テストウォッチモード
npm run test:ui      # テストUI起動
npm run lint         # ESLint実行
```

### 次のステップ

1. `.env`ファイルを作成（`.env.example`を参考）
2. Redis環境の準備
3. ゲームロジックの実装（`services/`、`models/`）
4. Socket.IOイベントハンドラーの実装
5. 単体テストの追加