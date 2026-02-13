Task
----

# [ ] client側、「準備完了」ボタンの実装をしてほしい
- ホスト側、ゲスト側、順番問わずどちらも準備完了を送る
- 両方準備完了の果として、ホスト側にもゲスト側にも手札が配られている
- また、デッキの残数もサーバから取得して更新されている
- また、星の数もサーバから取得して更新されている
- どちらが、先方かもサーバから取得して更新されている
- 一番下のログエリアに、ゲームを開始します、のログがでる
- 今のReactのコードを前提として、まずはどいう設計にするか、APIの呼び出し箇所、ポリシーをまずまとめてほしい（実装はその後）
  
## Claudeの意見

### 現在の実装状況

#### ✅ サーバー側（実装済み）
- `server/src/socket/index.ts:299-419`: `handleReady`関数が実装済み
- `ReadyPayload`で`{ roomId: string, playerId: string }`を受け取る
- 両プレイヤーが準備完了すると：
  - ゲーム状態を初期化（`GameService.createInitialGameState`）
  - 各プレイヤーに個別の`gameStart`イベントを送信
  - `GameStartPayload`には以下が含まれる：
    - `gameState`: マスクされたゲーム状態（相手の手札が隠されている）
    - `yourPlayerId`: 自分のプレイヤーID
    - `yourPlayerIndex`: 自分のプレイヤーインデックス（0または1）

#### ⚠️ クライアント側（部分実装）
1. **client/src/pages/Game.tsx:168-182**:
   - ❌ `handleReady`で`playerId`を送信していない（現在は`roomId`のみ）
   - ❌ `handleGameStart`（153-157行）でTODOコメントがあり、ゲーム状態の初期化が未実装
   - ✅ `socket.on('gameStart', handleGameStart)`でリスナーは登録済み

2. **client/src/components/Game/GameContainer.tsx**:
   - ✅ 準備完了ボタンのUIは実装済み（442-446行、509-519行、589-597行）
   - ✅ `useGameState`フックでゲーム状態を管理

3. **client/src/hooks/useGameState.ts**:
   - ✅ ローカルゲーム用の状態管理は完成
   - ❌ オンラインゲームでサーバーから受け取った状態を反映する機能がない
   - `RESET_GAME`アクションは新規ゲーム作成のみで、既存のゲーム状態からの初期化はできない

---

### 設計方針

#### アプローチ: useGameStateを拡張する（推奨）
既存の`useGameState`に新しいアクションを追加して、オフラインとオンラインで同じフックを使用できるようにする。

**理由**:
- コードの重複を避ける
- 既存のコードへの影響を最小限にできる
- オフライン・オンライン間での切り替えがスムーズ

---

### API呼び出しポリシー

#### 1. 準備完了の送信
**場所**: `client/src/pages/Game.tsx:168-182`（`handleReady`関数）

**修正内容**:
```typescript
const handleReady = () => {
  if (!roomIdParam || !actualPlayerId) return

  console.log('準備完了を送信:', { roomId: roomIdParam, playerId: actualPlayerId })
  socket.emit('ready', { roomId: roomIdParam, playerId: actualPlayerId }, (response: any) => {
    if (response?.success || response?.gameState) {
      // gameStateが返ってきた場合は両プレイヤーが準備完了している
      setIsReady(true)
      setIsWaitingForGameStart(response?.gameState ? false : true)
      console.log('準備完了しました')
    } else {
      console.error('準備完了に失敗:', response?.error)
    }
  })
}
```

**ポリシー**:
- `roomId`と`playerId`の両方を必須で送信
- callbackで成功/失敗を確認
- 成功時は`isReady: true`にする
- 両プレイヤーが準備完了している場合は`gameState`が返ってくる可能性がある

#### 2. ゲーム開始の受信
**場所**: `client/src/pages/Game.tsx:152-157`（`handleGameStart`関数）

**実装内容**:
```typescript
const handleGameStart = (data: GameStartPayload) => {
  console.log('ゲーム開始:', data)
  setIsWaitingForGameStart(false)

  // サーバーから受け取ったゲーム状態をクライアント側に反映
  initGameFromServer(data.gameState, data.yourPlayerIndex)

  // ゲーム開始のログを追加
  addCommentaryMessage('ゲームを開始します')

  // 先攻/後攻を表示
  const isFirstPlayer = data.yourPlayerIndex === data.gameState.currentPlayerIndex
  addCommentaryMessage(isFirstPlayer ? 'あなたの先攻です' : '相手の先攻です')
}
```

**ポリシー**:
- `GameStartPayload`から以下を取得：
  - `gameState`: サーバーから受け取ったゲーム状態
  - `yourPlayerId`: 自分のプレイヤーID
  - `yourPlayerIndex`: 自分のプレイヤーインデックス（0または1）
- `useGameState`の新しいアクションを使ってゲーム状態を初期化
- CommentaryAreaに「ゲームを開始します」ログを追加

#### 3. 状態の反映
サーバーから受け取った`gameState`（`GameStateDTO`型）には以下が含まれる：

```typescript
interface GameStateDTO {
  players: Array<{
    id: string
    hand: { cards: CardDTO[] }
    stars: number
  }>
  board: { cells: (CardDTO | null)[][] }
  deckCount: number
  totalStars: number
  currentPlayerIndex: 0 | 1
  gameState: GameState  // 'SETUP' | 'PLAYING' | 'FINISHED'
  lastAutoDrawnPlayerId: string | null
}
```

**反映する情報**:
- ✅ 手札: `gameState.players[yourPlayerIndex].hand.cards`
- ✅ デッキ残数: `gameState.deckCount`
- ✅ 星の数: `gameState.players[0].stars`, `gameState.players[1].stars`、`gameState.totalStars`
- ✅ 先攻/後攻: `gameState.currentPlayerIndex`（自分のインデックスと比較）
- ✅ 盤面: `gameState.board.cells`
- ✅ ログ: CommentaryAreaに「ゲームを開始します」を追加

#### 4. エラーハンドリング
- `socket.on('error')`でエラーを受信
- エラーメッセージをユーザーに表示
- 準備完了状態をリセット（`isReady: false`, `isWaitingForGameStart: false`）

---

### 実装ステップ

#### Step 1: 型定義の確認と追加
- ファイル: `client/src/lib/socket.ts`
- `GameStartPayload`型を追加（サーバー側の型定義を参考に）
- `@squfibo/shared`から`GameStateDTO`をインポート

#### Step 2: useGameStateの拡張
- ファイル: `client/src/hooks/useGameState.ts`
- 新しいアクション`INIT_FROM_SERVER`を追加
- `GameStateDTO`を受け取り、クライアント側の`Game`オブジェクトに変換
- reducerに以下のケースを追加：
  ```typescript
  case 'INIT_FROM_SERVER': {
    // GameStateDTOからGameオブジェクトを構築
    const game = Game.fromServerState(action.gameState, action.yourPlayerIndex)
    return {
      game,
      version: 0,
      currentPlayerIndexSnapshot: action.gameState.currentPlayerIndex,
      hasGameStarted: true,
    }
  }
  ```

#### Step 3: Game.tsx の修正
**3-1. handleReady の修正**:
- `playerId`を追加して送信（168-182行）
- `actualPlayerId`を使用

**3-2. handleGameStart の実装**:
- サーバーから受け取った`gameState`を`useGameState`の新しいアクションに渡す（152-157行）
- `isWaitingForGameStart`を`false`にする
- CommentaryAreaにログを追加する機能を実装

**3-3. CommentaryArea統合**:
- `Game.tsx`に`useCommentary`フックを追加
- `addMessage`関数を`GameContainer`に渡す
- または、`GameContainer`から上位に持ち上げる

#### Step 4: GameContainer.tsx の調整
- `onGameStart`コールバックを追加（オプション）
- オンラインモード時は`hasGameStarted`を`props`から受け取る

#### Step 5: エラーハンドリングの実装
- `socket.on('error')`リスナーを追加
- エラー時に準備完了状態をリセット

---

### 考慮事項

1. **GameStateDTOからGameオブジェクトへの変換**:
   - `Game.fromServerState`静的メソッドを追加する必要がある
   - または、reducerで直接変換処理を書く

2. **相手の手札のマスク**:
   - サーバー側で既にマスク済み（相手の手札は空配列になっている）
   - クライアント側では特別な処理は不要

3. **オンラインモードでの操作制限**:
   - 自分のターンでない時は操作を無効化
   - `yourPlayerIndex`と`currentPlayerIndex`を比較

4. **切断時の処理**:
   - 現時点では考慮しない（後で実装）

5. **ゲーム状態の同期**:
   - ゲーム開始後の各アクション（カード配置、役申告など）のサーバー連携は別タスク
   - 今回は「準備完了」→「ゲーム開始」の実装のみ

---

### まとめ

**実装の優先順位**:
1. ✅ Step 1: 型定義の確認と追加 - **完了**
2. ✅ Step 2: useGameStateの拡張（`INIT_FROM_SERVER`アクション追加） - **完了**
3. ✅ Step 3: `useOnlineGame`フックの作成 - **完了**
4. ✅ Step 4: Game.tsx の修正 - **完了**
5. ✅ Step 5: GameContainer.tsx の調整 - **完了**
6. 🔄 Step 6: CommentaryArea統合（ゲーム開始ログの表示） - **TODO**
7. 🔄 Step 7: エラーハンドリングの改善 - **TODO**

## 実装完了内容

### 1. 型定義の追加
- `client/src/lib/socket.ts`: `GameStartPayload`型を追加
- `squfibo-shared`から`GameStateDTO`をimport

### 2. Game.tsの拡張
- `Game.fromServerState()`静的メソッドを追加
- `GameStateDTO`からGameオブジェクトを構築する機能を実装

### 3. エンティティクラスの拡張
- `Player.setStars()`: 星の数を直接セットできるように
- `Hand.setCards()`: 手札を直接セットできるように

### 4. useGameStateの拡張
- `INIT_FROM_SERVER`アクションを追加
- `initFromServer()`メソッドを追加
- サーバーから受け取った`GameStateDTO`をクライアント側に反映可能に

### 5. useOnlineGameフックの作成
- Socket.io通信とゲーム状態管理を統合
- `sendReady()`: 準備完了を送信
- イベントリスナー: `gameStart`, `playerJoined`, `error`
- オンラインゲーム固有の状態管理: `isReady`, `isWaitingForGameStart`, `opponentPlayerName`, `gameStarted`

### 6. Game.tsxのリファクタリング
- `useOnlineGame`フックを統合
- `handleReady`を`onlineGame.sendReady`に置き換え
- Socket.ioイベントリスナーを削除（useOnlineGameで管理）

### 7. GameContainer.tsxの調整
- `onlineGameState` propsを追加
- オンラインモードの場合、propsから渡されたgameStateを使用
- オフラインモードの場合、従来通りローカルのuseGameStateを使用

**テストシナリオ**:
1. ホストが部屋を作成
2. ゲストが参加
3. ホストが「準備完了」ボタンを押す
4. ゲストが「準備完了」ボタンを押す
5. 両方に手札が配られ、デッキ残数・星の数が表示される
6. ログに「ゲームを開始します」が表示される
7. 先攻プレイヤーが分かる