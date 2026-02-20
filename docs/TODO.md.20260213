Task
-----

# [x] client側、ボタンの表現気違和感である
- ホストプレイヤー側、手札上側にあるゲストにおくるURLのコピーボタンの色味が淡すぎる
- 両プレイヤー、準備完了ボタンの色味が淡すぎる
- いずれも改善してほしい

**✅ 完了（2026-02-13）**: ボタンの色味を改善しました。

### 実装結果

#### 修正したファイル
1. **client/src/components/Hand/HandArea.css**
   - `.ready-button` - 準備完了ボタンのスタイル改善
     - 背景グラデーションを濃い紫色に変更: `#9333ea → #7e22ce`（Tailwind Purple 600-700）
     - フォントウェイトを600から700に変更（より太字に）
     - ボックスシャドウを強化: `rgba(147, 51, 234, 0.6)`
     - ホバー時: `#7e22ce → #6b21a8` とさらに濃い色に変化
     - activeステートのシャドウも更新

   - `.guest-url-copy-button` - ゲストURLコピーボタンのスタイル改善
     - 背景グラデーションを濃い紫色に変更: `#9333ea → #7e22ce`（Tailwind Purple 600-700）
     - ボックスシャドウを強化: `rgba(147, 51, 234, 0.7)`
     - ホバー時: `#7e22ce → #6b21a8` とさらに濃い色に変化
     - activeステートのシャドウも更新
     - コピー完了時は同じ濃さの紫（`#7e22ce → #6b21a8`）で視覚的フィードバック

#### 変更点まとめ
- **準備完了ボタン**: 鮮やかな紫色で視認性が大幅に向上、ゲーム中のボタンと明確に区別
- **ゲストURLコピーボタン**: 鮮やかな紫色で存在感を強調、ゲーム中のボタンと明確に区別
- 両ボタンとも紫色に統一し、ゲーム準備段階のUIとゲーム中のUIを視覚的に分離
- ゲーム中のボタン（「役を申告」オレンジ、「ターン終了」緑）との色の衝突を回避

#### ビルド確認
- ✅ ビルド成功: `npm run build` - エラーなし

# [x] client側、ゲストプレイヤーがゲームに参加する流れを実装してほしい
- ゲストはホストプレイヤーから受け取ったURLにアクセスする
- /game?roomId=<roomId>&role=guest の2つのパラメータをlocalStorageに設定する
- 上記2つのquery paramsがあってrole=guestの場合、ダイアログを出す
- ダイアログには、ゲストのプレイヤー名フィールドと部屋に入るボタンがある

**✅ 完了（2026-02-12）**: ゲストプレイヤーの参加フローの実装が完了しました。

### 実装結果

#### 作成したファイル

1. **client/src/components/JoinRoomDialog.tsx** - ゲスト参加ダイアログ
   - プレイヤー名入力フォーム（1〜20文字のバリデーション）
   - ローディング状態とエラー表示
   - 部屋参加機能（joinRoom イベント送信）
   - 参加成功時に親コンポーネントにコールバック

2. **client/src/components/JoinRoomDialog.css** - ダイアログスタイル
   - CreateRoomDialog.css を再利用
   - 説明文のスタイルを追加

#### 修正したファイル

1. **client/src/lib/socket.ts** - Socket.io 機能拡張
   - `JoinRoomPayload` 型を追加（roomId, playerName）
   - `RoomJoinedPayload` 型を追加（roomId, playerId, hostPlayerName）
   - `joinRoom()` 関数を実装（部屋参加APIのラッパー）
   - roomJoined イベントリスナーの登録

2. **client/src/pages/Game.tsx** - ゲスト参加フロー統合
   - JoinRoomDialog コンポーネントをインポート
   - ゲスト参加用のstate追加（guestPlayerName, guestPlayerId, showJoinDialog）
   - オンラインモード判定を更新（ダイアログで入力した情報も考慮）
   - ゲスト参加ダイアログの表示判定（useEffect）
   - `handleJoinRoomSuccess()` 関数を実装（部屋参加成功時の処理）
   - localStorageへの保存処理を追加

#### 動作フロー

**ゲストの場合:**
1. ゲストがホストから受け取ったURL（`/game?roomId=xxx&role=guest`）にアクセス
2. Game.tsx がマウントされ、query params を確認
3. role=guest かつ playerName 未設定の場合、JoinRoomDialog を表示
4. ゲストがプレイヤー名を入力して「部屋に入る」ボタンをクリック
5. Socket.io で `joinRoom` イベント送信（roomId, playerName）
6. サーバーから `roomJoined` イベント受信（playerId, hostPlayerName）
7. ゲスト情報を state と localStorage に保存
8. ダイアログが閉じられ、ゲーム画面に遷移
9. ホストに `playerJoined` イベントが送信される（サーバー側）
10. 準備完了ボタンが表示される

#### ビルド確認
- ✅ ビルド成功: `npm run build` - エラーなし
- ✅ TypeScriptの型チェック: エラーなし

#### 注意事項
- ゲストがURLにアクセスした時点ではまだゲーム画面は操作不可
- ダイアログでプレイヤー名を入力して部屋に参加する必要がある
- 部屋に参加後、準備完了ボタンを押すことでゲーム開始を待機
- localStorageに保存されるため、ページリロード時も状態が復元される

# [x] client側、ホストプレイヤーが/gameに遷移した後の後続処理を実装してほしい-2
- 遷移後、上のホスト側手札エリアには、ゲストにおくるURLのコピーフィールドがほしい
- pathは、/gameとする（ゲームするページを示す）
- query paramsで、roomId, role=guest をつけること

**✅ 完了（2026-02-12）**: ホスト画面の上側の手札エリアにゲスト招待用URLコピーフィールドの実装が完了しました。

### 実装結果

#### 修正・作成したファイル

1. **client/src/components/Hand/HandArea.tsx**
   - `guestUrlField?: ReactNode` propを追加
   - ゲストURLフィールドを表示するための処理を追加

2. **client/src/components/Hand/HandArea.css**
   - `.hand-guest-url-field`: ゲストURLフィールドのコンテナスタイル
   - `.guest-url-container`: URLコピーフィールドのコンテナ
   - `.guest-url-label`: ラベルスタイル
   - `.guest-url-input-wrapper`: 入力フィールドとボタンのラッパー
   - `.guest-url-input`: URL表示用の入力フィールド（読み取り専用）
   - `.guest-url-copy-button`: コピーボタン（緑グラデーション、ホバー効果、コピー完了時の色変更）

3. **client/src/pages/Game.tsx**
   - `GuestUrlCopyField` コンポーネントを追加（ゲストURLの生成とコピー機能）
   - ゲストURL生成ロジック: `${window.location.origin}/game?roomId=${roomId}&role=guest`
   - クリップボードAPIを使用したURLコピー機能
   - コピー成功時の2秒間のフィードバック表示
   - ホストかつゲスト未参加時にのみ `guestUrlField` を生成してGameContainerに渡す

4. **client/src/components/Game/GameContainer.tsx**
   - `guestUrlField?: React.ReactNode` propを追加
   - 上側の手札エリア（opponent-area）の `HandArea` コンポーネントに `guestUrlField` propを渡す

#### 動作フロー

**ホストの場合:**
1. ホストがWelcomeページで部屋を作成 → `/game?playerName=xxx&role=host&roomId=xxx&playerId=xxx` に遷移
2. 上側の手札エリア（ゲスト側）に「ゲスト招待用URL」フィールドが表示される
3. URLは `/game?roomId={roomId}&role=guest` の形式で生成される
4. 「コピー」ボタンをクリックすると、URLがクリップボードにコピーされる
5. コピー成功時、ボタンが「コピー完了!」と表示され、色が変わる（2秒間）
6. ゲストが参加すると、URLフィールドは非表示になり、ゲスト名が表示される

**URLの形式:**
```
http://localhost:5173/game?roomId=abc123&role=guest
```

#### ビルド確認
- ✅ ビルド成功: `npm run build` - エラーなし
- ✅ TypeScriptの型チェック: エラーなし

#### 注意事項
- ゲストURLは、ホストがゲーム画面に遷移した直後から利用可能
- ゲストが参加するまで表示され、参加後は自動的に非表示になる
- URLにはroomIdとrole=guestのみが含まれ、playerNameは含まれない（ゲストが自分で入力する想定）
- クリップボードAPIが利用できない環境では、コピー機能が動作しない可能性がある

# [x] client側、ホストプレイヤーが/gameに遷移した後の後続処理を実装してほしい
- usehooks をまずnpm installしてほしい
- query paramsで引き継いだ、roomId, playerId, role, playerNameを、localStorageにいれてほしい
- 下の手札は常にホストプレイヤーとみなし、この段階で手札エリアには準備完了ボタンがある状態にしてほしい
- まず、実装に入るまえにここに書かれた仕様を分析して、レビューしてほしい
- レビューした内容はこの見出しのサブ項目に記載してほしい

**✅ 完了（2026-02-12）**: ホストプレイヤーが/gameに遷移した後の準備完了フローの実装が完了しました。

### 実装結果

#### インストールしたパッケージ
- `usehooks-ts` (v3.1.0): React用カスタムフックライブラリ（localStorageとReact stateの自動同期）

#### 修正・作成したファイル

1. **client/src/pages/Game.tsx** - オンラインモード対応
   - `useLocalStorage` フックでquery params（roomId, playerId, role, playerName）をlocalStorageに保存
   - オンラインモード判定（isOnlineMode）
   - 準備完了状態の管理（isReady, isWaitingForGameStart）
   - Socket.io イベントリスナー（playerJoined, gameStart）
   - 準備完了ボタン押下時の処理（`ready` イベント送信）
   - GameContainerにオンラインモードのpropsを渡す

2. **client/src/components/Game/GameContainer.tsx** - 準備完了UI実装
   - オンラインモードのprops追加（isOnlineMode, role, playerName, opponentPlayerName, isReady, isWaitingForGameStart, onReady）
   - プレイヤー名の表示ロジック実装（role固定：host=下側、guest=上側）
   - 準備完了ボタンの表示判定
   - オンラインモード時は「新しいゲーム」ボタンを非表示

3. **client/src/components/Hand/HandArea.tsx** - 準備完了ボタン対応
   - `readyButton?: ReactNode` propを追加
   - 準備完了ボタンまたは待機メッセージを表示

4. **client/src/components/Hand/HandArea.css** - スタイル追加
   - `.hand-ready-button`: 準備完了ボタンのコンテナ
   - `.ready-button`: 準備完了ボタンのスタイル（青グラデーション、ホバー効果）
   - `.waiting-message`: 待機メッセージのスタイル

5. **client/src/lib/socket.ts** - socket インスタンスのexport追加
   - `export const socket` を追加して、外部からアクセス可能に

#### 実装方針（ロール固定）

**プレイヤー配置:**
- **player1（下側）= ホスト**（role === 'host'）
- **player2（上側）= ゲスト**（role === 'guest'）

**メリット:**
- サーバーから送られるGameStateをそのまま表示できる
- 条件分岐が少なくシンプル
- デバッグが容易

**プレイヤー名表示:**
- ホストの場合: 下側に「{playerName}（ホスト）」、上側に「{opponentPlayerName}（ゲスト）」
- ゲストの場合: 上側に「{playerName}（ゲスト）」、下側に「{opponentPlayerName}（ホスト）」

#### 動作フロー

**ホストの場合:**
1. ホストがWelcomeページで部屋を作成 → `roomCreated` イベント受信
2. `/game?playerName=xxx&role=host&roomId=xxx&playerId=xxx` に自動遷移
3. Game.tsxでquery paramsをlocalStorageに保存
4. 下側の手札エリアに「準備完了」ボタンが表示される
5. ホストが準備完了ボタンを押す → Socket.ioで`ready`イベント送信
6. 待機メッセージ「準備完了しました。ゲストプレイヤーの参加を待っています...」が表示される
7. ゲストが参加 → `playerJoined` イベント受信（上側の手札エリアにゲスト名が表示）
8. ゲストが準備完了 → `gameStart` イベント受信でゲーム開始

**ゲストの場合:**
1. ゲストがゲスト用URLにアクセス → 部屋に参加（`joinRoom`）
2. `/game?playerName=xxx&role=guest&roomId=xxx&playerId=xxx` に遷移
3. Game.tsxでquery paramsをlocalStorageに保存
4. 上側の手札エリアに「準備完了」ボタンが表示される
5. ゲストが準備完了ボタンを押す → Socket.ioで`ready`イベント送信
6. 待機メッセージ「準備完了しました。相手プレイヤーの準備を待っています...」が表示される
7. ホストも準備完了 → `gameStart` イベント受信でゲーム開始

#### ビルド確認
- ✅ ビルド成功: `npm run build` - エラーなし
- ✅ TypeScriptの型チェック: エラーなし

#### 注意事項
- 現時点では準備完了画面までの実装
- ゲーム中のSocket.io連携（カード配置、役申告など）は未実装
- `gameStart` イベント受信後の実際のゲーム開始処理は今後のタスクで実装予定
- ゲスト参加フローの実装も今後のタスクで対応予定

---

## Claude レビュー

### 1. 仕様の全体像

このタスクは、ホストプレイヤーが部屋を作成して `/game` に遷移した後の「準備完了フロー」を実装するものです。

**想定される動作フロー:**
1. ホストがWelcomeページで部屋を作成 → `roomCreated` イベント受信
2. `/game?playerName=xxx&role=host&roomId=xxx&playerId=xxx` に自動遷移
3. Game.tsxでquery paramsを取得し、localStorageに保存
4. GameContainerに「準備完了」ボタンを表示（手札エリア）
5. ホストが準備完了ボタンを押す → Socket.ioで`ready`イベント送信
6. ゲストが参加して準備完了したら → `gameStart` イベント受信でゲーム開始

### 2. usehooks-ts パッケージについて

**指示内容:** `usehooks` をnpm installする

**分析:**
- おそらく `usehooks-ts` のことを指していると推測（TypeScript対応のReactカスタムフックライブラリ）
- 主な用途: `useLocalStorage` フックを使ってlocalStorageとReact stateを自動同期
- 代替案: 標準の `useEffect` + `localStorage` でも実装可能だが、usehooks-tsの方が簡潔

**推奨:** `usehooks-ts` をインストールする

### 3. localStorageへの保存について

**指示内容:** query params（roomId, playerId, role, playerName）をlocalStorageに保存

**目的:**
- ページリロード時にオンラインゲームの状態を復元
- ネットワーク切断時の再接続に必要な情報を保持

**実装方針:**
- Game.tsx で useEffect を使ってquery paramsを取得
- `useLocalStorage` フックで以下のキーに保存:
  - `squfibo-online-roomId`
  - `squfibo-online-playerId`
  - `squfibo-online-role`
  - `squfibo-online-playerName`

**注意点:**
- query paramsが存在しない場合（通常のローカルゲーム）は保存しない
- ゲーム終了時にlocalStorageをクリアする処理も必要（将来実装）

### 4. 準備完了ボタンの表示について

**指示内容:** 下の手札エリアに準備完了ボタンを表示

**現状の課題:**
- 現在のGameContainerは通常のローカル対戦用のUIで、「新しいゲーム」ボタンが表示される
- オンラインモードでは、ゲーム開始前に「準備完了」フェーズが必要
- 準備完了前は盤面を見せるが、カード配置などの操作はできない状態

**実装方針:**
1. **GameContainerにオンラインモードのpropsを追加**
   - `isOnlineMode: boolean` - オンラインモードか判定
   - `role: 'host' | 'guest'` - プレイヤーの役割
   - `onReady: () => void` - 準備完了ボタン押下時のコールバック

2. **準備完了状態の管理**
   - Game.tsx で準備完了状態を管理（`isReady: boolean`）
   - 準備完了ボタンを押すと、Socket.ioで`ready`イベント送信
   - サーバーから`gameStart`イベントを受信するまで待機

3. **UI の表示切り替え**
   - `!isReady && isOnlineMode` の場合:
     - HandArea（下側）に「準備完了」ボタンを表示
     - 盤面、手札は表示するが、クリックイベントは無効化
     - 「新しいゲーム」ボタンは非表示
   - `isReady && isOnlineMode` の場合:
     - 「準備完了しました。相手プレイヤーの参加を待っています...」と表示
     - まだ操作はできない
   - `gameStart` イベント受信後:
     - 通常のゲームUIに切り替わり、操作可能になる

4. **HandAreaコンポーネントの拡張**
   - 新しいprop: `readyButton?: ReactNode` を追加
   - オンラインモードで準備完了前の場合のみ、ボタンを表示

### 5. 設計上の懸念点と推奨事項

**懸念点1: GameContainerの責務が重くなる**
- 現在のGameContainerは500行以上のコード
- オンラインモードのロジックを追加すると、さらに複雑化する

**推奨:** 段階的実装で進める
- Phase 1: まずは最小限の実装（準備完了ボタンのみ）
- Phase 2: Socket.io連携（将来のタスクで対応）
- Phase 3: ゲーム状態の同期（将来のタスクで対応）

**懸念点2: 「下の手札は常にホストプレイヤー」という仕様**
- 仕様では「下の手札は常にホストプレイヤーとみなし」とあるが、これは視覚的な配置の話
- 実際には role='guest' の場合でも、自分の手札は下に表示すべき
- つまり「自分視点」でUIを構築する必要がある

**推奨:**
- 「下側 = 自分（操作可能）」「上側 = 相手（操作不可）」という設計
- role は関係なく、常に自分の手札は下に表示

**懸念点3: 既存のゲームロジックとの整合性**
- 現在のGameクラス（domain/Game.ts）はローカル対戦専用
- オンラインモードでは、サーバーから送られてくるGameStateに基づいてUIを更新する必要がある
- しかし、このタスクでは「準備完了ボタンの表示」までなので、ゲームロジックの改修は不要

**推奨:**
- このタスクではUIの表示のみに集中
- Socket.io連携は最小限（readyイベント送信のみ）

### 6. 実装ステップの提案

#### Step 1: usehooks-ts のインストール
```bash
cd client && npm install usehooks-ts
```

#### Step 2: Game.tsx でlocalStorageに保存
- query paramsを取得
- `useLocalStorage` フックで保存
- GameContainerにオンラインモードのpropsを渡す

#### Step 3: GameContainer.tsx に準備完了UI追加
- オンラインモードのpropsを受け取る
- 準備完了前の状態を管理（`isWaitingForGameStart`）
- HandAreaに準備完了ボタンを表示

#### Step 4: Socket.io連携（最小限）
- Game.tsx で準備完了ボタン押下時に`ready`イベント送信
- `gameStart` イベント受信時に状態を更新

### 7. 実装時の注意点

- **既存のローカルゲーム機能を壊さない**
  - query paramsがない場合は従来通りの動作
  - オンラインモードとローカルモードを明確に分岐

- **エラーハンドリング**
  - Socket.io接続失敗時の処理
  - roomIdが無効な場合の処理
  - localStorageが使えない環境への対応

- **型安全性**
  - role は `'host' | 'guest'` の型で定義
  - localStorageの値は型ガードでバリデーション

### 8. まとめ

このタスクは「準備完了画面」の実装であり、実際のゲームプレイ機能は含まれません。

**実装すべきこと:**
1. ✅ usehooks-ts のインストール
2. ✅ query params → localStorage への保存
3. ✅ 準備完了ボタンの表示（手札エリア）
4. ✅ Socket.io で `ready` イベント送信

**実装しないこと（将来のタスク）:**
- ❌ カード配置のSocket.io連携
- ❌ ゲーム状態の同期
- ❌ ターン管理のオンライン対応
- ❌ 役申告のSocket.io連携

**次のタスクで必要になること:**
- ゲスト参加画面の実装
- ゲーム中のSocket.io連携
- 切断・再接続処理

# [x] client側、オンライン版を開始するダイアログの後続処理を実装したい-2
- ホストがPlayerNameをいれたら、/gameにすぐ遷移してほしい
- そのプレイヤーネームとrole=hostを、query parameterとして/game画面に引き継いでほしい
- 現在用意してある、コピー用フィールドがあるダイアログは不要なので関連コンポーネントは削除してほしい

**✅ 完了（2026-02-12）**: オンライン版開始ダイアログの後続処理が完了しました。

### 実装結果

#### 修正したファイル
1. **client/src/components/CreateRoomDialog.tsx**
   - `onSuccess` コールバックを追加（部屋作成成功時に親コンポーネントに通知）
   - URL表示部分を削除（117-179行目）
   - 部屋作成成功後、即座に親コンポーネントに通知して遷移するように変更
   - 不要なstate（`roomData`, `copiedUrl`）を削除
   - 不要な関数（`handleCopyUrl`）を削除

2. **client/src/pages/Welcome.tsx**
   - `useNavigate` をインポート
   - `handleRoomCreated` 関数を追加（部屋作成成功時に/gameに遷移）
   - query parameterに以下を追加:
     - `playerName`: ホストのプレイヤー名
     - `role`: "host"
     - `roomId`: 作成された部屋のID
     - `playerId`: ホストのプレイヤーID
   - CreateRoomDialogに`onSuccess`プロパティを追加

3. **client/src/pages/Game.tsx**
   - `useSearchParams` をインポートしてquery parameterを読み取り
   - playerName, role, roomId, playerIdを取得
   - オンラインゲームモードの情報をコンソールにログ出力（デバッグ用）

#### 動作フロー
1. ユーザーが「オンライン版を開始する」ボタンをクリック
2. ダイアログが表示され、プレイヤー名を入力
3. 「部屋を作成」ボタンをクリック
4. Socket.ioで`createRoom`イベントをサーバーに送信
5. サーバーから`roomCreated`イベントを受信
6. `onSuccess`コールバックが呼び出され、ダイアログが閉じる
7. `/game?playerName=xxx&role=host&roomId=xxx&playerId=xxx`に即座に遷移
8. Game.tsxでquery parameterを読み取り、コンソールに出力

#### ビルド確認
- ✅ ビルド成功: `npm run build` - エラーなし
- ✅ TypeScriptの型チェック: エラーなし

#### 注意事項
- GameContainerはまだquery parameterを使用していない（将来の実装で対応予定）
- 現時点では、/gameページにクエリパラメータが渡されるところまで実装
- オンラインゲームとしての実装は今後のタスクで対応

---

# [x] client側、オンライン版を開始するダイアログの後続処理を実装したい-1
- ./shared/ の型をつかって、./client/ 以下の重複処理は削除してほしい
- 現在は、client側にCPUとの対戦用の実装があるが、これに関わる分岐ロジックやソースは削除してほしい
- client側は、buildさえ通れば、一旦はゲームとして機能しなくてもよい

## Claudeの実装計画

### 現状分析

#### CPU関連の実装箇所
- **CPU関連ファイル（削除対象）:**
  - `client/src/types/CPUDifficulty.ts` - CPU難易度の型定義
  - `client/src/domain/services/cpu/` - CPU戦略の実装（全ファイル）
    - CPUStrategy.ts, CPUEasyStrategy.ts, CPUNormalStrategy.ts
    - CPUStrategyFactory.ts, index.ts
    - テストファイル（*.test.ts）

- **CPU関連コード（削除対象）:**
  - `client/src/domain/Game.ts` - CPUターン実行メソッド、cpuDifficultyフィールド
  - `client/src/domain/entities/Player.ts` - cpuDifficultyフィールド、isCPU()メソッド
  - `client/src/hooks/useGameState.ts` - CPUターン実行関連のアクション・関数
  - `client/src/components/Game/GameContainer.tsx` - CPU実行状態管理、難易度選択モーダル、CPUターン自動開始

#### 型の重複箇所
- **client側 valueObjects（削除対象）:**
  - `client/src/domain/valueObjects/CardColor.ts` - shared側とほぼ同じ
  - `client/src/domain/valueObjects/CardValue.ts` - 値オブジェクトクラス（shared側はtype）
  - `client/src/domain/valueObjects/Position.ts` - 値オブジェクトクラス（shared側はinterface）

- **設計の違い:**
  - client側: ドメイン駆動設計の値オブジェクトパターン（class）
  - shared側: シンプルな型定義（type/interface + ヘルパー関数）

- **方針:**
  - shared側の型定義をclient側で使用する
  - client側の値オブジェクトクラスは廃止
  - ヘルパー関数やユーティリティはshared側を利用

### 実装ステップ

#### Phase 1: shared パッケージの依存関係追加
- [ ] client/package.json に shared パッケージへの参照を追加
- [ ] client側で shared の型をインポートできるようにする

#### Phase 2: CPU関連の削除
- [ ] CPU関連のフォルダとファイルを削除
  - `client/src/types/CPUDifficulty.ts`
  - `client/src/domain/services/cpu/` （フォルダごと）
- [ ] Game.ts からCPU関連コードを削除
  - CPUDifficulty import
  - cpuDifficulty フィールド
  - executeCPUTurn() メソッド
  - createNewGame() の cpuDifficulty パラメータ
- [ ] Player.ts からCPU関連コードを削除
  - cpuDifficulty フィールド
  - isCPU() メソッド
- [ ] useGameState.ts からCPU関連コードを削除
  - CPUDifficulty, CPUActionStep import
  - executeCPUTurn, executeCPUStep 関数
  - EXECUTE_CPU_TURN, EXECUTE_CPU_STEP アクション
  - resetGame の cpuDifficulty パラメータ
- [ ] GameContainer.tsx からCPU関連UIを削除
  - CPU実行状態管理のstate
  - CPU難易度選択モーダル
  - CPUターン自動開始のuseEffect
  - executeNextCPUStep 関数
  - 難易度関連のimport

#### Phase 3: 値オブジェクトの置き換え
- [ ] CardColor の置き換え
  - `shared/src/types/CardColor.ts` を使用
  - client側の valueObjects/CardColor.ts を削除
  - 全ての import を shared 側に変更
- [ ] CardValue の置き換え
  - shared側は type CardValueType (1 | 4 | 9 | 16)
  - client側の CardValue クラスを削除
  - Card エンティティで number 型として扱う
  - バリデーションは shared の isValidCardValue() を使用
- [ ] Position の置き換え
  - shared側は interface Position
  - client側の Position クラスを削除
  - Position.of() → 普通のオブジェクト生成 { row, col }
  - equals() → shared の positionEquals() を使用

#### Phase 4: ビルド確認とテストの修正
- [ ] ビルドエラーの修正
  - 型エラーの解消
  - import パスの修正
- [ ] テストファイルの修正
  - CPU関連テストの削除
  - 値オブジェクトのテストを shared の型に合わせて修正
- [ ] ビルドの成功確認

### 注意事項
- **buildが通ることが最優先**（ゲームが機能しなくてもよい）
- shared パッケージへの依存を正しく設定する
- 値オブジェクトの置き換えは広範囲に影響するため、段階的に実施
- テストは後で修正してもよい（まずはビルドを優先）

---

**✅ 完了（2026-02-11）**: client側のCPU関連削除とshared型への置き換えが完了しました。

### 実装結果

#### Phase 1: shared パッケージの依存関係追加
- ✅ client/package.json に shared パッケージへの参照を追加（file:../shared）
- ✅ shared パッケージをESModule形式でビルド（module: "ESNext"）
- ✅ package.jsonに "type": "module" を追加

#### Phase 2: CPU関連の削除
- ✅ CPU関連のフォルダとファイルを削除
  - client/src/types/CPUDifficulty.ts
  - client/src/domain/services/cpu/ （フォルダごと）
- ✅ Game.ts からCPU関連コードを削除
  - cpuDifficulty フィールド
  - executeCPUTurn() メソッド
  - createNewGame() の cpuDifficulty パラメータ
- ✅ Player.ts からCPU関連コードを削除
  - cpuDifficulty フィールド
  - isCPU() メソッド
- ✅ useGameState.ts からCPU関連コードを削除
  - executeCPUTurn, executeCPUStep 関数
  - EXECUTE_CPU_TURN, EXECUTE_CPU_STEP アクション
- ✅ GameContainer.tsx からCPU関連UIを削除
  - CPU実行状態管理のstate
  - CPU難易度選択モーダル
  - CPUターン自動開始のuseEffect
- ✅ Game.test.ts からCPU関連のテストを削除

#### Phase 3: 値オブジェクトの置き換え
- ✅ **CardColor** の置き換え
  - client/src/domain/valueObjects/CardColor.ts を削除
  - shared/src/types/CardColor.ts を使用（enum）
  - 全ファイルのimportをsharedに変更

- ✅ **CardValue** の置き換え
  - client/src/domain/valueObjects/CardValue.ts を削除
  - shared/src/types/CardValue.ts の CardValueType (1 | 4 | 9 | 16) を使用
  - Card.ts の value プロパティを CardValueType に変更
  - `.value.value` を `.value` に一括置換
  - `CardValue.of(n)` を数値リテラル `n` に置換
  - テストファイルでの CardValue 使用を数値に置換

- ✅ **Position** の置き換え
  - client/src/domain/valueObjects/Position.ts を削除
  - shared/src/types/Position.ts の Position interface を使用
  - `Position.of(row, col)` を `{ row, col }` に一括置換
  - `position.equals(other)` を `positionEquals(position, other)` に置換
  - positionEquals 関数をsharedからimport
  - 全ファイルのimportをsharedに変更

#### ビルドとテストの結果
- ✅ ビルド成功: `npm run build` - エラーなし
- ✅ テスト成功: `npm test` - 94個のテスト全て通過
  - Hand.test.ts: 6 tests ✓
  - Player.test.ts: 5 tests ✓
  - Deck.test.ts: 6 tests ✓
  - Board.test.ts: 7 tests ✓
  - Combo.test.ts: 3 tests ✓
  - ComboDetector.test.ts: 23 tests ✓
  - Game.test.ts: 39 tests ✓
  - Card.test.ts: 5 tests ✓

#### 削除されたファイル
- client/src/types/CPUDifficulty.ts
- client/src/domain/services/cpu/* (フォルダごと)
- client/src/domain/valueObjects/CardColor.ts
- client/src/domain/valueObjects/CardColor.test.ts
- client/src/domain/valueObjects/CardValue.ts
- client/src/domain/valueObjects/CardValue.test.ts
- client/src/domain/valueObjects/Position.ts
- client/src/domain/valueObjects/Position.test.ts

#### 主な変更点
- client側の独自の値オブジェクトクラスをsharedのシンプルな型定義に統一
- CPU対戦機能を完全に削除し、オンライン対戦専用に
- shared パッケージをESModule形式でビルドし、Viteとの互換性を確保
- 型安全性を保ちながら、コードの重複を解消

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