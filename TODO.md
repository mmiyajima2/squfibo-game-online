# タスク

## [✓] ロギングの設計に懸念あり、意見がほしい
- ✅ この見出しのサブ項目に意見を書いてほしい
- ✅ プロダクションでは、systemdをつかって標準出力をログとしてjournalctlで扱えるようにしたい
- ✅ たとえば、Javaでいうlogbackなどのライブラリを導入したほうが良いか、意見がほしい
- ✅ systemdでデーモンかすることを前提として、その進め方を示してほしい
- ✅ Pinoを導入してlogger.tsを作成
- ✅ 既存のconsole.logをloggerに置き換え

### Claudeの意見

#### 1. Node.jsのロギング戦略

**推奨アプローチ: 標準出力 + 構造化ログ + systemd統合**

##### ロギングライブラリの選択

Node.jsでは以下のライブラリが人気です：

1. **Pino（推奨）**
   - 超高速（最速のNode.jsロガー）
   - 構造化ログ（JSON）
   - systemdと相性が良い
   - 本番環境で実績多数

2. **Winston**
   - 機能豊富（複数のトランスポート対応）
   - カスタマイズ性が高い
   - やや重い

3. **console.log（非推奨）**
   - シンプルだが、構造化されていない
   - レベル管理が困難
   - 本番環境では不十分

**結論: Pinoを推奨します**

理由：
- systemdのjournaldが受け取る標準出力に最適化されている
- JSON形式なので後処理が容易
- パフォーマンスが優れている
- 12-factor appのベストプラクティスに準拠

---

#### 2. systemdとの統合設計

##### 基本方針

```
アプリケーション（Node.js）
  ↓ stdout/stderr に JSON 出力
systemd/journald（自動キャプチャ）
  ↓ journalctl コマンドで閲覧
ログ管理・分析
```

この設計の利点：
- アプリケーションはログファイル管理不要（標準出力のみ）
- systemdが自動的にログをキャプチャ
- ログローテーション、圧縮、保持期間は systemd が管理
- journalctl でフィルタリング、検索が容易

---

#### 3. 実装ステップ

##### ステップ1: Pinoの導入

```bash
npm install pino pino-pretty
```

`server/src/utils/logger.ts`:
```typescript
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // 本番環境では JSON、開発環境では人間が読みやすい形式
  transport: isProduction ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  },

  // 構造化ログに含める基本情報
  base: {
    env: process.env.NODE_ENV || 'development'
  }
});
```

使用例：
```typescript
import { logger } from './utils/logger';

logger.info({ roomId: 'abc123' }, 'Room created');
logger.error({ err, userId: 'user1' }, 'Failed to join room');
logger.debug({ eventName: 'placeCard' }, 'Received event');
```

---

##### ステップ2: systemd サービスファイルの作成

`/etc/systemd/system/squfibo-game.service`:
```ini
[Unit]
Description=Squfibo Game Online Server
After=network.target redis.service
Requires=redis.service

[Service]
Type=simple
User=squfibo
Group=squfibo
WorkingDirectory=/opt/squfibo-game-online/server
Environment="NODE_ENV=production"
Environment="LOG_LEVEL=info"
Environment="PORT=3000"
EnvironmentFile=-/etc/squfibo-game/config.env

# Node.js の実行
ExecStart=/usr/bin/node dist/server.js

# 自動再起動（クラッシュ時）
Restart=on-failure
RestartSec=10s

# ログ設定（journald に自動転送）
StandardOutput=journal
StandardError=journal
SyslogIdentifier=squfibo-game

# セキュリティ強化
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/squfibo-game-online/server/logs

# リソース制限
LimitNOFILE=65536
MemoryLimit=1G

[Install]
WantedBy=multi-user.target
```

---

##### ステップ3: デーモン化の手順

```bash
# 1. アプリケーションをビルド
cd /opt/squfibo-game-online/server
npm run build

# 2. systemd サービスファイルをリロード
sudo systemctl daemon-reload

# 3. サービスを有効化（起動時に自動起動）
sudo systemctl enable squfibo-game.service

# 4. サービスを起動
sudo systemctl start squfibo-game.service

# 5. ステータス確認
sudo systemctl status squfibo-game.service

# 6. ログ確認
sudo journalctl -u squfibo-game.service -f
```

---

##### ステップ4: journalctl でログ管理

```bash
# リアルタイムでログを表示
sudo journalctl -u squfibo-game.service -f

# 直近100行を表示
sudo journalctl -u squfibo-game.service -n 100

# 特定期間のログを表示
sudo journalctl -u squfibo-game.service --since "2026-02-10 10:00:00"

# JSON形式で出力（構造化ログの解析）
sudo journalctl -u squfibo-game.service -o json-pretty

# エラーログのみ表示
sudo journalctl -u squfibo-game.service -p err

# 特定フィールドで検索（JSON構造を活用）
sudo journalctl -u squfibo-game.service | grep '"roomId":"abc123"'
```

---

#### 4. ログレベルの運用指針

| レベル | 用途 | 例 |
|--------|------|-----|
| **fatal** | サービス停止に至る重大エラー | データベース接続失敗 |
| **error** | エラーだが、サービスは継続 | ユーザーリクエスト失敗 |
| **warn** | 警告（問題の予兆） | Redis接続遅延、メモリ使用率高 |
| **info** | 重要なイベント（本番デフォルト） | 部屋作成、ゲーム開始 |
| **debug** | デバッグ情報（開発環境） | イベントペイロード詳細 |
| **trace** | 最も詳細（パフォーマンス調査） | 関数の入出力 |

本番環境では `info` レベルを推奨、問題調査時は `debug` に変更。

---

#### 5. ログローテーション設定

journald は自動でログローテーションを行いますが、設定を調整可能：

`/etc/systemd/journald.conf`:
```ini
[Journal]
SystemMaxUse=1G      # ディスク使用量の上限
SystemMaxFileSize=100M  # 1ファイルの最大サイズ
MaxRetentionSec=2week   # ログ保持期間
```

設定変更後：
```bash
sudo systemctl restart systemd-journald
```

---

#### 6. 推奨ディレクトリ構成

```
/opt/squfibo-game-online/
├── server/
│   ├── dist/              # ビルド成果物
│   ├── src/
│   └── package.json
├── /etc/systemd/system/
│   └── squfibo-game.service
└── /etc/squfibo-game/
    └── config.env         # 環境変数（機密情報）
```

---

#### 7. まとめ

**推奨実装:**
1. ✅ **Pinoを導入**（軽量、高速、systemd対応）
2. ✅ **標準出力にJSON形式で出力**（12-factor app準拠）
3. ✅ **systemd serviceでjournaldに自動転送**
4. ✅ **journalctlでログ閲覧・分析**
5. ✅ **ファイルベースのログは不要**（systemdが管理）

**メリット:**
- シンプルな実装（アプリケーションはログファイル管理不要）
- systemdネイティブ統合
- 高パフォーマンス
- 運用が容易（journalctl コマンド一つで全て管理）

**次のステップ:**
1. Pinoの導入とlogger.tsの作成
2. 既存のconsole.logをloggerに置き換え
3. systemd serviceファイルの作成
4. デプロイ手順書の作成

## [✓] server側で「盤面満杯時にカードを除去する（ターン開始前）」イベントを実装してほしい
- ✅ server側だけでよい
- ✅ ./shared/ にあるソースを参考にすること

### 実装内容
- `server/src/socket/eventTypes.ts` - `CardRemovedPayload`型定義追加
- `server/src/services/GameService.ts` - ボード操作メソッド追加
  - `isBoardFull`: 盤面が満杯かチェック
  - `isValidPosition`: 位置が有効かチェック
  - `getCardAt`: 指定位置のカードを取得
  - `removeCardFromBoard`: 盤面からカードを除去
- `server/src/socket/index.ts` - `removeCard`イベントハンドラー実装
  - バリデーション（roomId、position、ターンプレイヤー、盤面満杯チェック）
  - カード除去処理
  - `cardRemoved`イベントと`gameStateUpdate`イベントの送信
- `server/test-client/test-driver.html` - `removeCard`イベントのテスト対応
  - フォーム追加（部屋ID、行、列）
  - イベントリスナー追加（cardRemoved、gameStateUpdate）

## [✓] 仕様書 `./docs/socketio_events.md` について「プレイヤーが準備完了を通知する」の仕様を相談したい
- ✅ 準備完了のイベントをserver側で受け取ってゲームが開始される理解である
- ✅ この時、どちらが先攻かをパラメータとして送る必要はないだろうか？
- ~~意見をこの見出しのサブ項目に記載してほしい~~
- ✅ server側について、「プレイヤーが準備完了を通知する」の実装をしてほしい
- ✅ 先攻の決め方は、推奨のアプローチAを前提としてよい

### 実装内容

- `server/src/socket/eventTypes.ts` - `GameStartPayload`型定義追加
  - gameState: GameStateDTO
  - yourPlayerId: string
  - yourPlayerIndex: 0 | 1
- `server/src/services/GameService.ts` - ゲーム初期化サービス（新規作成）
  - createInitialGameState: ゲームの初期状態を生成
  - createDeck: 標準デッキ（42枚）を生成
  - shuffleDeck: Fisher-Yates法でシャッフル
  - saveGameState: ゲーム状態をRedisに保存
  - getGameState: ゲーム状態をRedisから取得
- `server/src/services/RoomService.ts` - 準備状態管理機能追加
  - RoomInfoに`hostReady`、`guestReady`フィールド追加
  - markPlayerReady: プレイヤーを準備完了にする
  - setRoomPlaying: 部屋のステータスをPLAYINGに更新
- `server/src/socket/index.ts` - readyイベントハンドラー実装
  - バリデーション（roomId、プレイヤーが部屋に参加しているか）
  - socket.idからplayerIdを特定
  - RoomService.markPlayerReadyを呼び出し
  - 両プレイヤーがreadyになったらGameService.createInitialGameStateを実行
  - ゲーム状態をRedisに保存
  - 各プレイヤーに個別の`gameStart`イベントを送信（yourPlayerIdとyourPlayerIndexを設定）
- `server/test-client/test-driver.html` - readyイベントのテスト対応
  - 未実装マークを削除
  - gameStartイベントのリスナーを追加

### ゲームの初期化仕様

- **デッキ構成**: 1×4枚、4×4枚、9×9枚、16×4枚（各色RED、BLUE）= 合計42枚
- **初期配布**: 各プレイヤー8枚ずつ
- **先攻決定**: サーバー側でランダム（Math.random() < 0.5）
- **初期盤面**: 3x3の空盤面
- **初期星数**: 21個

### Claudeの意見

#### 1. 先攻・後攻の決定方法について

**現在の仕様:**
- `ready`イベントではroomIdのみを送信
- 両プレイヤーがreadyになると、サーバーが`gameStart`イベントを送信
- `gameStart`に含まれる`currentPlayerIndex`で先攻プレイヤーが決定される

**先攻・後攻をパラメータで送る必要性の検討:**

##### アプローチA: サーバー側でランダム決定（推奨）
**メリット:**
- シンプルで実装が容易
- 公平性が保証される（完全なランダム）
- クライアント側のロジックが不要
- 悪意のあるクライアントによる不正が防げる

**実装イメージ:**
```typescript
// サーバー側
const firstPlayerIndex = Math.random() < 0.5 ? 0 : 1;
```

##### アプローチB: クライアントから先攻・後攻を指定
**メリット:**
- プレイヤー間で事前に決めた順番を反映できる（じゃんけんなど）
- ホストを常に先攻にするなど、明示的なルール適用が可能

**デメリット:**
- 両プレイヤーが先攻を主張した場合の調整ロジックが必要
- 実装が複雑になる
- ホストが常に有利な選択をする可能性（公平性の問題）

**実装イメージ:**
```typescript
// readyイベントのペイロード
{
  roomId: string;
  wantFirstTurn?: boolean;  // 先攻を希望するか（オプション）
}

// サーバー側の調整ロジック
if (両者が先攻希望 || 両者が後攻希望) {
  // ランダムで決定
} else {
  // 希望に従う
}
```

##### アプローチC: ホストが決定権を持つ
**メリット:**
- 部屋を作った人が順番を決められる
- UI設計がシンプル（ホストのみに選択肢を表示）

**デメリット:**
- ホストが有利（常に先攻を選ぶ可能性）
- ゲストの意見が反映されない

#### 2. 推奨案

**推奨: アプローチA（サーバー側でランダム決定）**

理由：
1. **公平性**: 完全にランダムで、どちらのプレイヤーも有利・不利がない
2. **シンプル**: クライアント側で何も指定する必要がなく、実装が簡潔
3. **セキュリティ**: クライアント側の不正な操作を防げる
4. **現在の仕様との整合性**: `ready`イベントは既にroomIdのみの設計になっており、変更不要

**将来的な拡張案:**
もし「プレイヤーが先攻・後攻を選びたい」という要望があれば、以下のような段階的な実装も可能：
1. まずは完全ランダムで実装
2. 将来的に「フレンドマッチ設定」として、ホストが先攻・後攻・ランダムを選べる機能を追加

**結論:**
現時点では`ready`イベントにパラメータを追加する必要はなく、サーバー側でランダムに先攻・後攻を決定する方式を推奨します。

## [✓] server側、「既存の対戦部屋に参加する」を実装してほしい
- ✅ server側だけでよい
- ✅ 今使っているserver側実装を試すテスト用ドライバを、全てのイベントで利用できるよう汎用的にしてほしい

### 実装内容
- `server/src/socket/eventTypes.ts` - `RoomJoinedPayload`型定義追加
- `server/src/services/RoomService.ts` - `joinRoom`メソッド実装（ゲスト専用）
  - 部屋の存在チェック
  - ステータスチェック（WAITING状態のみ参加可能）
  - 満室チェック（guestPlayerIdがnullかどうか）
  - ゲスト情報の登録と部屋情報の更新
- `server/src/socket/index.ts` - イベントハンドラー実装
  - **createRoom**: ホストを自動的にSocket.IOルームに参加させる
  - **joinRoom**: ゲスト専用のイベントハンドラー
    - バリデーション（roomId、playerName）
    - Socket.IOルームへの参加
    - `roomJoined`イベントの送信
    - `playerJoined`イベントのブロードキャスト（ホストに通知）
    - エラーハンドリング（ROOM_NOT_FOUND、ROOM_FULL、ROOM_NOT_AVAILABLE）

### 設計方針
- **ホスト**: `createRoom`イベントで部屋を作成すると同時に自動的に部屋に参加（Socket.IOルームにjoin）
- **ゲスト**: `joinRoom`イベントで明示的に部屋に参加する必要がある
- この設計により、ホストは部屋作成後すぐにリアルタイム通信が可能

### テストドライバの汎用化
- `server/test-client/test-driver.html` - 汎用イベントテストドライバー（新規作成）
  - イベント選択機能（createRoom、joinRoom、その他）
  - イベント別の動的フォーム表示
  - 汎用的な結果表示（JSON形式）
  - リアルタイム接続状態表示
  - レスポンシブデザイン
- `server/test-client/test-join-room.js` - joinRoom専用テストスクリプト（新規作成）
- `server/test-client/test-event-generic.js` - 汎用イベントテストスクリプト（新規作成）
  - 任意のイベント名とペイロードJSONを受け取る
  - 全てのSocket.IOイベントをテスト可能
- `server/test-client/README.md` - ドキュメント更新
  - 汎用テストドライバーの使い方
  - テストシナリオ例
  - トラブルシューティング

### テスト項目
- ✅ `joinRoom`イベントの送信
- ✅ `roomJoined`イベントの受信
- ✅ `playerJoined`イベントのブロードキャスト
- ✅ 部屋の存在チェック
- ✅ 満室チェック
- ✅ 部屋情報の更新

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