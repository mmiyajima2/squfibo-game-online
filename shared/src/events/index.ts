/**
 * Socket.IOイベント型定義のエクスポート
 */

// イベント名
export {
  ClientEventNames,
  ServerEventNames,
  EventNames,
  type ClientEventName,
  type ServerEventName,
  type EventName,
} from './EventNames';

// クライアント→サーバーのイベント型
export {
  type GameCreateRequest,
  type GameJoinRequest,
  type PlaceCardRequest,
  type ClaimComboRequest,
  type DiscardBoardCardRequest,
  type EndTurnRequest,
  type LeaveGameRequest,
  type ClientEvents,
} from './ClientEvents';

// サーバー→クライアントのイベント型
export {
  type GameCreatedEvent,
  type GameJoinedEvent,
  type GameStateUpdateEvent,
  type CardPlacedEvent,
  type ComboClaimedEvent,
  type BoardCardDiscardedEvent,
  type TurnEndedEvent,
  type GameFinishedEvent,
  type PlayerJoinedEvent,
  type PlayerLeftEvent,
  type GameErrorEvent,
  type ServerEvents,
} from './ServerEvents';
