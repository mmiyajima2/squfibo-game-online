タスク
-----

# [~] 共通型定義ファイルの作成をしてほしい
- client側はブラウザゲームとして完成している状態で、これをオンライン版に改造しようとしている
- server側はスケルトンしかない状態である
- ~~まずはどのようにすすめるか、計画をこの項のサブ項目に記載してほしい~~ ✅完了

**進捗**: フェーズ1完了 🎉

## Claudeの計画

### 現状分析

**Client側の構成**：
- ブラウザゲームとして完成済み
- Domain-Driven Designの構造（entities, valueObjects, services）
- 主要な型：
  - エンティティ：`Card`, `Board`, `Player`, `Hand`, `Deck`, `Game`
  - 値オブジェクト：`CardValue`, `CardColor`, `Position`
  - サービス：`Combo`, `ComboType`, `ComboDetector`, CPU戦略
  - その他：`GameState`, `CPUDifficulty`

**Server側の構成**：
- スケルトンのみ（Express + Socket.IO + Redis）
- 実装が必要な状態

**Shared/ディレクトリ**：
- 現在空（ここに共通型を配置予定）

### 共有型定義の方針

#### 1. 型共有の戦略
オンライン対戦版では以下の3層アプローチを採用：

**A. 基本型層（shared/types/）**
- カード、位置、色などの基本的な型定義
- クライアント・サーバー双方で使用する不変の型
- 例：`CardColor`, `CPUDifficulty`, `ComboType`など

**B. DTO層（shared/dto/）**
- クライアント・サーバー間の通信用データ転送オブジェクト
- ゲーム状態のシリアライズ形式
- 例：`CardDTO`, `BoardStateDTO`, `GameStateDTO`, `PlayerDTO`など

**C. イベント層（shared/events/）**
- Socket.IOイベントの型定義（送信/受信）
- イベント名の定数定義
- 例：`PlaceCardEvent`, `ClaimComboEvent`, `GameUpdateEvent`など

#### 2. 実装計画（段階的アプローチ）

**フェーズ1: 基本型とDTOの定義**
1. `shared/`ディレクトリのセットアップ
   - `package.json`作成（TypeScript設定）
   - `tsconfig.json`作成
   - ビルド設定

2. 基本型の定義（`shared/types/`）
   - `CardColor.ts` - カードの色（enum）
   - `CardValue.ts` - カードの値（1, 4, 9, 16）
   - `Position.ts` - 盤面の位置（row, col）
   - `ComboType.ts` - 役の種類（THREE_CARDS, TRIPLE_MATCH）
   - `GameState.ts` - ゲーム状態（PLAYING, FINISHED）
   - `CPUDifficulty.ts` - CPU難易度

3. DTO定義（`shared/dto/`）
   - `CardDTO.ts` - カード情報
   - `PositionDTO.ts` - 位置情報
   - `BoardStateDTO.ts` - 盤面状態
   - `HandDTO.ts` - 手札情報
   - `PlayerDTO.ts` - プレイヤー情報
   - `ComboDTO.ts` - 役情報
   - `GameStateDTO.ts` - ゲーム全体の状態

**フェーズ2: Socket.IOイベント型の定義**
1. イベント定義（`shared/events/`）
   - `EventNames.ts` - イベント名の定数
   - `ClientEvents.ts` - クライアント→サーバーのイベント型
   - `ServerEvents.ts` - サーバー→クライアントのイベント型

2. 主要なイベント：
   - `game:create` - ゲーム作成
   - `game:join` - ゲーム参加
   - `game:place-card` - カード配置
   - `game:claim-combo` - 役の申告
   - `game:end-turn` - ターン終了
   - `game:state-update` - ゲーム状態更新（broadcast）
   - `game:error` - エラー通知

**フェーズ3: Client側のリファクタリング**
- Client側を共通型を使うように段階的に移行
- 既存のドメインモデルは残し、DTOへの変換層を追加

**フェーズ4: Server側の実装**
- 共通型を使ってサーバーロジックを実装
- ゲームステート管理（Redis）
- Socket.IOハンドラー実装

### 設計上の考慮事項

1. **疎結合の維持**：
   - ドメインモデル（client/src/domain）は独立性を保つ
   - DTOを介してのみ通信を行う
   - サーバー側も独自のドメインモデルを持つことが可能

2. **型安全性**：
   - すべての通信データに明確な型定義
   - Socket.IOイベントも型安全に

3. **拡張性**：
   - 将来の機能追加を考慮した構造
   - バージョニングを考慮（必要に応じて）

4. **テスト容易性**：
   - shared/もユニットテスト可能な構造
   - DTOのバリデーション実装

### 実装状況

#### ✅ フェーズ1完了（2026-02-06）

**作成したファイル**：

1. **設定ファイル**
   - `shared/package.json` - パッケージ定義
   - `shared/tsconfig.json` - TypeScript設定
   - `shared/vitest.config.ts` - テスト設定
   - `shared/eslint.config.js` - ESLint設定
   - `shared/README.md` - ドキュメント

2. **基本型定義** (`shared/src/types/`)
   - `CardColor.ts` - カードの色（enum: RED, BLUE）
   - `CardValue.ts` - カードの値（1, 4, 9, 16）+ バリデーション
   - `Position.ts` - 位置情報 + バリデーション/比較関数
   - `ComboType.ts` - 役の種類 + 報酬計算関数
   - `GameState.ts` - ゲーム状態（enum: PLAYING, FINISHED）
   - `CPUDifficulty.ts` - CPU難易度 + ラベル/バリデーション
   - `index.ts` - エクスポート

3. **DTO定義** (`shared/src/dto/`)
   - `CardDTO.ts` - カード情報
   - `PositionDTO.ts` - 位置情報
   - `BoardStateDTO.ts` - 盤面状態（3x3セル）
   - `HandDTO.ts` - 手札情報
   - `PlayerDTO.ts` - プレイヤー情報
   - `ComboDTO.ts` - 役情報
   - `GameStateDTO.ts` - ゲーム全体の状態
   - `index.ts` - エクスポート

4. **メインエクスポート**
   - `shared/src/index.ts` - すべてのエクスポート

**ビルド結果**：
- `dist/` ディレクトリに正常にコンパイル完了
- 型定義ファイル（.d.ts）と source map も生成済み

**利用可能なnpmスクリプト**：
```bash
npm run build        # TypeScriptビルド
npm run watch        # ウォッチモード
npm run test         # テスト実行
npm run lint         # ESLint実行
```

### 次のステップ

**フェーズ2**: Socket.IOイベント型の定義（未着手）
- `shared/src/events/` ディレクトリの作成
- イベント名定数の定義
- クライアント→サーバーイベント型
- サーバー→クライアントイベント型


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