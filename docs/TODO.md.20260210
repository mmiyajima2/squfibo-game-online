タスク
-----

# [x] バグ:部屋の状態制御がおかしい気がする
- 2ともreadyを送ってゲームを開始する
- 先攻が手札を(0, 0)におく->見かけ上は成功
- 後攻が手札を(0, 1)におく->以下のエラーがでる\
 「エラー: プレイヤーが部屋に参加していません (NOT_IN_ROOM)」

## 原因
- 全てのイベントハンドラーで`socket.id`を使ってプレイヤーを特定していたが、Socket接続が変わると`socket.id`も変わるため、playerIdを特定できなくなっていた

## 最終的な修正内容（payloadベースの設計に変更）
- **socket.idへの依存を完全に削除**
- **ready以降の全イベントのpayloadに`playerId`と`roomId`を含める設計に変更**
- サーバー側：
  - eventTypes.tsのpayload型定義に`playerId`フィールドを追加
  - 各イベントハンドラーで`payload.playerId`を使用するように変更
  - `validatePlayerInRoom()`関数でplayerIdの検証
- test-driver.html：
  - ready、removeCard、claimCombo、endTurn、leaveRoomの各フォームに`playerId`フィールドを明示的に追加
  - createRoom/joinRoomのレスポンス後、全フォームに自動入力
  - フォームの値を直接payloadに使用（透明性・デバッグ性の向上）

## メリット
- Socket接続の変化に完全に対応
- React実装時にフォーム構造がそのままAPIの構造を反映
- テスト・デバッグが容易
- より標準的で予測可能な設計

# [x] バグ修正:server側、readyイベントの結果情報に誤りがありそう
- 先攻も後攻も、同じプレイヤーIDの手札情報がきてしまっている
- それぞれ手札情報は自分自身のJSONがくるべきだし、相手の手札情報を取得してはいけない

## 調査結果
- server/src/socket/index.ts:332-345で、両プレイヤーに同一のgameStateを送信していた
- gameStateには両プレイヤーの手札情報が含まれているため、相手の手札が見えてしまっていた

## 修正内容
- GameService.maskOpponentHand()関数を追加（相手の手札をマスク）
- handleReady()で各プレイヤーに送信前に、相手の手札をマスクしたgameStateを生成するように修正

# [x] server側、「役の成立を申告する（カード配置＋役申告でターン確定）」の実装をしてください
- server側だけでよいです。