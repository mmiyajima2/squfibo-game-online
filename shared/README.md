# @squfibo/shared

SquFiboゲームのクライアント・サーバー間で共有される型定義とDTOを提供するパッケージです。

## 構成

### `types/` - 基本型定義
ゲームの基本的な型定義（enum、定数など）

- `CardColor.ts` - カードの色
- `CardValue.ts` - カードの値
- `Position.ts` - 盤面の位置
- `ComboType.ts` - 役の種類
- `GameState.ts` - ゲーム状態

### `dto/` - データ転送オブジェクト
クライアント・サーバー間の通信で使用するデータ構造

- `CardDTO.ts` - カード情報
- `PositionDTO.ts` - 位置情報
- `BoardStateDTO.ts` - 盤面状態
- `HandDTO.ts` - 手札情報
- `PlayerDTO.ts` - プレイヤー情報
- `ComboDTO.ts` - 役情報
- `GameStateDTO.ts` - ゲーム全体の状態

### `events/` - Socket.IOイベント型定義
Socket.IOによるリアルタイム通信で使用するイベント型

- `EventNames.ts` - イベント名定数
- `ClientEvents.ts` - クライアント→サーバーのイベント型
- `ServerEvents.ts` - サーバー→クライアントのイベント型

## 使用方法

### インストール

```bash
npm install
```

### ビルド

```bash
npm run build
```

### 開発時（ウォッチモード）

```bash
npm run watch
```

### テスト

```bash
npm run test
npm run test:watch
```

## client/server からの参照方法

### client側での参照例

```typescript
import { CardColor, GameStateDTO } from '../shared/dist';
// または開発時
import { CardColor, GameStateDTO } from '../shared/src';
```

### server側での参照例

```typescript
import { CardDTO, PlayerDTO } from '../shared/dist';
// または開発時
import { CardDTO, PlayerDTO } from '../shared/src';
```
