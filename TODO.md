Task
-----

# [x] client側、ウエルカム画面で「オンライン版を開始する」を押した場合の実装をしたい
- 押下すると、ダイアログがでる
- ダイアログには、ホストのプレイヤー名をいれて対戦部屋を作成する、という流れにしたい
- その結果として、ホスト用URLとゲスト用URLが表示されるところまでつくってほしい
- server/　の実装済みである

**✅ 完了（2026-02-10）**: ウエルカム画面のオンライン版開始機能の実装が完了しました。

## Claudeの実装計画

### 現状分析
- Welcome.tsxの「オンライン版を開始する」ボタンは単純に`/game`へリンク
- Socket.io クライアントライブラリが未インストール
- サーバー側は`createRoom`イベントで部屋作成が実装済み

### 実装ステップ

#### 1. 必要なパッケージのインストール
- `socket.io-client`: Socket.io通信用

#### 2. Socket.io接続管理の実装
- `client/src/lib/socket.ts`: Socket.io接続とイベント管理

#### 3. ダイアログコンポーネントの作成
- `client/src/components/CreateRoomDialog.tsx`: 部屋作成ダイアログ
- `client/src/components/CreateRoomDialog.css`: スタイル
- 入力内容:
  - プレイヤー名（1〜20文字）
- 表示内容:
  - ローディング状態
  - エラーメッセージ
  - 成功時: ホスト用URL、ゲスト用URL、コピーボタン

#### 4. Welcome.tsxの更新
- 「オンライン版を開始する」ボタンでダイアログを開く
- ダイアログからSocket.ioで`createRoom`イベントを送信
- `roomCreated`イベントを受信してURLを表示

#### 5. ファイル構成
```
client/src/
├── lib/
│   └── socket.ts           # Socket.io接続管理（新規）
├── components/
│   ├── CreateRoomDialog.tsx # 部屋作成ダイアログ（新規）
│   └── CreateRoomDialog.css # ダイアログスタイル（新規）
└── pages/
    └── Welcome.tsx          # ダイアログ統合（更新）
```

#### 6. 実装の優先順位
1. Socket.io クライアントのインストール
2. Socket.io接続管理ファイルの作成
3. ダイアログコンポーネントの作成
4. Welcome.tsxの更新とダイアログ統合

---

### 実装結果

#### インストールしたパッケージ
- `socket.io-client` (v4.8.3): Socket.io通信用

#### 作成したファイル
1. **client/src/lib/socket.ts** - Socket.io接続管理
   - シングルトンパターンでSocket.ioクライアントを管理
   - 自動再接続、エラーハンドリング
   - `createRoom()` 関数を実装（部屋作成APIのラッパー）
   - サーバーURL: `http://localhost:3000` (開発環境)

2. **client/src/components/CreateRoomDialog.tsx** - 部屋作成ダイアログ
   - プレイヤー名入力フォーム（1〜20文字のバリデーション）
   - ローディング状態とエラー表示
   - 部屋作成成功時にホスト用URL、ゲスト用URLを表示
   - URLコピーボタン（クリップボードAPI使用）
   - 部屋ID、有効期限の表示

3. **client/src/components/CreateRoomDialog.css** - ダイアログスタイル
   - モーダルオーバーレイ（背景クリックで閉じる）
   - アニメーション付き（フェードイン、スライドアップ）
   - レスポンシブデザイン対応

#### 修正したファイル
- **client/src/pages/Welcome.tsx**
  - 「オンライン版を開始する」ボタンをLinkからbuttonに変更
  - ダイアログの開閉状態管理（useState）
  - CreateRoomDialogコンポーネントを統合

#### 動作フロー
1. ユーザーが「オンライン版を開始する」ボタンをクリック
2. ダイアログが表示され、プレイヤー名を入力
3. 「部屋を作成」ボタンをクリック
4. Socket.ioで`createRoom`イベントをサーバーに送信
5. サーバーから`roomCreated`イベントを受信
6. ホスト用URL、ゲスト用URLをダイアログに表示
7. URLをコピーボタンでクリップボードにコピー可能

#### 動作確認
- ビルドが成功し、エラーなし
- 開発サーバーで動作確認可能（`npm run dev`）
- サーバーが起動していれば、実際に部屋を作成できる

#### 注意事項
- サーバーが起動している必要があります（`cd server && npm run dev`）
- サーバーのURLは環境変数 `VITE_SERVER_URL` で変更可能
- ホスト用URLとゲスト用URLは、実際のゲーム画面への遷移は未実装（次のステップで対応予定）

# [x] ./cleint/ 側の実装の1st stepを対応してほしい
- 現状は、ブラウザゲームとして完成していてい、サーバーとの通信は考慮してない
- まず、やって欲しいことは以下のとおり
  - / のindexページは、「SquFiboゲーム」へのウエルカムページにしたい
  - ウエルカムページには、SquFiboとは何か、\
  オンライン版を開始するのボタン、
  ブラウザ版で遊ぶのボタン、
  マニュアル表示のリンク、
  Googleアドセンス用の枠（ダミー）を作ってほしい
- 今のclient/以下のソースは、オンライン版として改造する予定である
- 仮実装として、「オンライン版を開始する」を選ぶと、今のclinet/以下で機能するゲーム画面にいけるようにする
- Router用のライブラリなど必要なものはインストールしてよい
- 最初に、この見出しのサブ項目に、実装計画を記載してほしい

## Claudeの意見（実装計画）

### 現状分析
- 現在のApp.tsxは直接GameContainerを表示している
- Reactプロジェクト（React 19 + Vite）
- ルーターは未導入

### 実装計画

#### 1. React Routerの導入
- `react-router-dom`をインストール
- App.tsxにルーティング構造を設定

#### 2. ページ構成
- `/` - ウエルカムページ（新規作成）
- `/game` - 既存のゲーム画面（GameContainer）
- `/manual` - マニュアルページ（将来的に実装、現時点では準備のみ）

#### 3. ウエルカムページの実装（`src/pages/Welcome.tsx`）
以下のセクションを含むページを作成：
- **ヘッダー**: SquFiboのロゴ・タイトル
- **ゲーム説明**: SquFiboとは何か（簡潔な紹介文）
- **アクションボタン**:
  - 「オンライン版を開始する」ボタン → `/game`へ遷移
  - 「ブラウザ版で遊ぶ」ボタン → `/game`へ遷移（※現時点では同じ画面）
- **マニュアルリンク**: `/manual`へのリンク
- **広告枠**: Googleアドセンス用のダミー枠（見た目のみ実装）

#### 4. ファイル構成
```
client/src/
├── App.tsx              # ルーター統合（改修）
├── main.tsx             # エントリーポイント（変更なし）
├── pages/
│   ├── Welcome.tsx      # ウエルカムページ（新規）
│   ├── Welcome.css      # ウエルカムページ用スタイル（新規）
│   ├── Game.tsx         # ゲームページ（新規）
│   └── Manual.tsx       # マニュアルページ（新規・将来実装）
└── components/
    └── Game/
        └── GameContainer.tsx  # 既存のゲームコンテナ
```

#### 5. 実装の優先順位
1. React Routerのインストール
2. ページコンポーネント（Welcome、Game）の作成
3. App.tsxのルーター統合
4. スタイリング

#### 6. 注意事項
- 既存のGameContainerは変更しない
- 「オンライン版」と「ブラウザ版」は現時点では同じゲーム画面に遷移
- マニュアルページは将来実装のため、現時点では準備のみ（「準備中」メッセージを表示）

---

**✅ 完了（2026-02-10）**: クライアント側の1st step実装が完了しました。

### 実装結果

#### インストールしたパッケージ
- `react-router-dom`: クライアントサイドルーティング用

#### 作成したファイル
1. `client/src/pages/Welcome.tsx` - ウエルカムページ（SquFiboの紹介、アクションボタン、マニュアルリンク、広告枠）
2. `client/src/pages/Welcome.css` - ウエルカムページのスタイル（グラデーション背景、アニメーション付き）
3. `client/src/pages/Game.tsx` - ゲームページ（既存のGameContainerをラップ）
4. `client/src/pages/Manual.tsx` - マニュアルページ（準備中表示）

#### 修正したファイル
- `client/src/App.tsx` - React Routerを統合し、ルート定義を追加

#### ルート構成
- `/` - ウエルカムページ
- `/game` - ゲーム画面
- `/manual` - マニュアルページ（準備中）

#### 動作確認
- ビルドが成功し、エラーなし
- 開発サーバーで動作確認可能（`npm run dev`）

# [x] `./docs/socketio_events.md` Server to Client の実装状況を調査してほしい
- ~~この見出しのサブ見出しに調査結果を記載してほしい~~
- ~~未実装箇所の実装を対応してほしい（以下、サブ見出しの内容に基づくこと）~~

**✅ 完了（2026-02-10）**: 全13イベント中13個の実装が完了しました。

## Claudeの調査結果

以下、`./docs/socketio_events.md` に定義されている Server to Client イベント（計13種類）の実装状況を調査しました。

### 実装済みイベント（13/13） - 全て実装完了！

| No | イベント名 | 実装状況 | 実装箇所 | 備考 |
|---|---|---|---|---|
| 1 | `roomCreated` | ✅ 実装済 | `server/src/socket/index.ts:141` | ホストに部屋作成完了を通知 |
| 2 | `playerJoined` | ✅ 実装済 | `server/src/socket/index.ts:227` | ホストにゲスト参加を通知 |
| 3 | `roomJoined` | ✅ 実装済 | `server/src/socket/index.ts:224` | ゲスト本人に参加確認を通知 |
| 4 | `gameStart` | ✅ 実装済 | `server/src/socket/index.ts:345, 353` | 両プレイヤーにゲーム開始を通知（相手の手札はマスク済み） |
| 5 | `gameStateUpdate` | ✅ 実装済 | `server/src/socket/index.ts:554, 846, 1132` | カード除去、役成立、カード配置時に送信 |
| 6 | `cardRemoved` | ✅ 実装済 | `server/src/socket/index.ts:551` | 盤面満杯時のカード除去完了を通知 |
| 7 | `comboResolved` | ✅ 実装済 | `server/src/socket/index.ts:839` | 役成立・解決完了を通知 |
| 8 | `turnEnded` | ✅ 実装済 | `server/src/socket/index.ts:1125` | 役申告なしでターン終了を通知 |
| 9 | `turnChanged` | ✅ 実装済 | `server/src/socket/index.ts:890, 1143` | ターン変更を通知 |
| 10 | `gameFinished` | ✅ 実装済 | `server/src/socket/index.ts:874` | ゲーム終了を通知 |
| 11 | `playerLeft` | ✅ 実装済 | `server/src/socket/index.ts:1252` | プレイヤー退出を相手に通知 |
| 12 | `error` | ✅ 実装済 | 複数箇所 | エラー発生時に送信（バリデーションエラー、サーバーエラーなど） |
| 13 | `playerDisconnected` | ✅ 実装済 | `server/src/socket/index.ts:1307` | プレイヤー切断を相手に通知（30秒再接続待機） |

### 未実装イベント（0/13） - 全て実装完了！

| No | イベント名 | 実装状況 | 備考 |
|---|---|---|---|
| 13 | `playerDisconnected` | ✅ **実装完了** | `server/src/socket/index.ts:1307-1379`に実装。<br>切断時の再接続待機処理、30秒タイムアウト、相手プレイヤー勝利処理を実装。 |

### 詳細な実装状況

#### ✅ 実装済みで特筆すべき点

1. **gameStart イベントの実装が優秀**
   - 各プレイヤーに個別に送信（ホストとゲスト）
   - `GameService.maskOpponentHand()` により相手の手札情報を適切にマスク
   - セキュリティ面で正しい実装

2. **エラーハンドリングが充実**
   - すべてのイベントハンドラーで適切なバリデーション実施
   - エラーコードと日本語メッセージを含む `ErrorPayload` を返却
   - callback と emit の両方で通知

3. **ゲーム終了判定**
   - `claimCombo` イベント内で `GameService.checkGameEnd()` を呼び出し
   - 終了条件（全星獲得 or 山札空）を判定して `gameFinished` イベントを送信

#### ❌ 未実装の課題

**playerDisconnected イベント**
- 仕様: プレイヤーが切断された際、30秒以内の再接続を待機
- 現状: `disconnect` イベントハンドラーはログ出力のみで、以下が未実装:
  - 切断されたプレイヤーの情報管理
  - 再接続期限（30秒）の管理
  - 相手プレイヤーへの `playerDisconnected` イベント送信
  - 再接続時のゲーム状態同期処理
  - タイムアウト時の対戦相手勝利処理

### 実装完了した内容（2026-02-10）

#### `playerDisconnected` イベントの実装

**実装ファイル:**
- `server/src/socket/eventTypes.ts` - `PlayerDisconnectedPayload` 型定義を追加
- `server/src/socket/index.ts` - `handleDisconnect` および `handleReconnectTimeout` 関数を実装

**実装内容:**
1. ✅ 切断時に部屋情報を確認し、ゲーム中（PLAYING状態）の場合のみ処理
2. ✅ 相手プレイヤーに `playerDisconnected` イベントを送信（再接続期限を含む）
3. ✅ 30秒後のタイムアウト処理を設定
4. ✅ タイムアウト時に相手プレイヤーの勝利として `gameFinished` イベントを送信
5. ✅ socket.dataにplayerIdとroomIdを保存（createRoom、joinRoom時）
6. ✅ 切断情報をメモリで管理（`disconnectedPlayers` Map）

**動作フロー:**
```
プレイヤー切断
  ↓
ゲーム中（PLAYING）かチェック
  ↓
相手に playerDisconnected イベント送信
  ↓
30秒タイマー開始
  ↓
（再接続なし）
  ↓
タイムアウト → 相手プレイヤー勝利
  ↓
gameFinished イベント送信
```

### 今後の改善点

1. **再接続処理の実装**
   - 現在、切断検知とタイムアウト処理は実装済み
   - 再接続時にplayerIdを引き継ぐ仕組みが未実装
   - クライアント側でplayerIdをlocalStorageに保存する機能が必要
   - サーバー側で再接続を検知してタイムアウトをキャンセルする処理が必要

2. **テストの追加**
   - 各Server to Clientイベントの統合テスト
   - 特に切断・再接続のエッジケースのテスト
   - タイムアウト処理の正常動作確認