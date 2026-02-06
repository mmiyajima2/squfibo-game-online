/**
 * Socket.IOイベント名の定数定義
 * クライアント・サーバー間の通信で使用するイベント名を一元管理
 */

/**
 * クライアント→サーバーのイベント名
 */
export const ClientEventNames = {
  /** ゲーム作成リクエスト */
  GAME_CREATE: 'game:create',

  /** ゲーム参加リクエスト */
  GAME_JOIN: 'game:join',

  /** カード配置リクエスト */
  GAME_PLACE_CARD: 'game:place-card',

  /** 役の申告リクエスト */
  GAME_CLAIM_COMBO: 'game:claim-combo',

  /** ボードカード破棄リクエスト（ボード満杯時） */
  GAME_DISCARD_BOARD_CARD: 'game:discard-board-card',

  /** ターン終了リクエスト */
  GAME_END_TURN: 'game:end-turn',

  /** ゲーム退出リクエスト */
  GAME_LEAVE: 'game:leave',
} as const;

/**
 * サーバー→クライアントのイベント名
 */
export const ServerEventNames = {
  /** ゲーム作成成功 */
  GAME_CREATED: 'game:created',

  /** ゲーム参加成功 */
  GAME_JOINED: 'game:joined',

  /** ゲーム状態更新（全員に配信） */
  GAME_STATE_UPDATE: 'game:state-update',

  /** カード配置成功 */
  CARD_PLACED: 'card:placed',

  /** 役の申告成功 */
  COMBO_CLAIMED: 'combo:claimed',

  /** ボードカード破棄成功 */
  BOARD_CARD_DISCARDED: 'board-card:discarded',

  /** ターン終了通知 */
  TURN_ENDED: 'turn:ended',

  /** ゲーム終了通知 */
  GAME_FINISHED: 'game:finished',

  /** プレイヤー参加通知 */
  PLAYER_JOINED: 'player:joined',

  /** プレイヤー退出通知 */
  PLAYER_LEFT: 'player:left',

  /** エラー通知 */
  GAME_ERROR: 'game:error',
} as const;

/**
 * すべてのイベント名（型チェック用）
 */
export const EventNames = {
  ...ClientEventNames,
  ...ServerEventNames,
} as const;

/**
 * クライアントイベント名の型
 */
export type ClientEventName = typeof ClientEventNames[keyof typeof ClientEventNames];

/**
 * サーバーイベント名の型
 */
export type ServerEventName = typeof ServerEventNames[keyof typeof ServerEventNames];

/**
 * すべてのイベント名の型
 */
export type EventName = typeof EventNames[keyof typeof EventNames];
