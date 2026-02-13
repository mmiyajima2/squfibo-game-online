import { useEffect, useState, useCallback } from 'react';
import { useGameState } from './useGameState';
import { socket } from '../lib/socket';
import type { GameStartPayload } from '../lib/socket';

interface UseOnlineGameOptions {
  roomId: string | null;
  playerId: string | null;
  role: 'host' | 'guest' | null;
  playerName: string | null;
  enabled?: boolean; // オンラインモードが有効かどうか
}

interface UseOnlineGameReturn {
  // オンラインゲーム固有の状態
  isReady: boolean;
  isWaitingForGameStart: boolean;
  opponentPlayerName: string | null;
  gameStarted: boolean;

  // アクション
  sendReady: () => void;

  // ゲーム状態（useGameStateから）
  game: ReturnType<typeof useGameState>['game'];
  hasGameStarted: ReturnType<typeof useGameState>['hasGameStarted'];
  version: ReturnType<typeof useGameState>['version'];
  currentPlayerIndex: ReturnType<typeof useGameState>['currentPlayerIndex'];
  placeCardFromHand: ReturnType<typeof useGameState>['placeCardFromHand'];
  claimCombo: ReturnType<typeof useGameState>['claimCombo'];
  endTurn: ReturnType<typeof useGameState>['endTurn'];
  discardFromBoard: ReturnType<typeof useGameState>['discardFromBoard'];
  discardFromHand: ReturnType<typeof useGameState>['discardFromHand'];
  drawAndPlaceCard: ReturnType<typeof useGameState>['drawAndPlaceCard'];
  resetGame: ReturnType<typeof useGameState>['resetGame'];
  cancelPlacement: ReturnType<typeof useGameState>['cancelPlacement'];
}

/**
 * オンラインゲーム用のカスタムフック
 * Socket.ioの通信とゲーム状態管理を統合
 */
export function useOnlineGame({
  roomId,
  playerId,
  role,
  playerName,
  enabled = true,
}: UseOnlineGameOptions): UseOnlineGameReturn {
  const [isReady, setIsReady] = useState(false);
  const [isWaitingForGameStart, setIsWaitingForGameStart] = useState(false);
  const [opponentPlayerName, setOpponentPlayerName] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  // ゲーム状態管理
  const gameState = useGameState();

  /**
   * 準備完了を送信
   */
  const sendReady = useCallback(() => {
    if (!roomId || !playerId) {
      console.error('roomId or playerId is missing');
      return;
    }

    console.log('準備完了を送信:', { roomId, playerId });
    socket.emit('ready', { roomId, playerId }, (response: any) => {
      if (response?.success || response?.gameState) {
        setIsReady(true);
        // gameStateが返ってきた場合は両プレイヤーが準備完了している
        setIsWaitingForGameStart(response?.gameState ? false : true);
        console.log('準備完了しました');
      } else if (response?.code) {
        // エラーレスポンス
        console.error('準備完了に失敗:', response?.message || response?.code);
        // TODO: エラーメッセージをユーザーに表示
      } else {
        console.error('準備完了に失敗:', response);
      }
    });
  }, [roomId, playerId]);

  /**
   * Socket.ioイベントリスナーの登録
   */
  useEffect(() => {
    if (!enabled || !roomId || !playerId) return;

    // ゲーム開始イベント
    const handleGameStart = (data: GameStartPayload) => {
      console.log('ゲーム開始:', data);
      setIsWaitingForGameStart(false);
      setGameStarted(true);

      // サーバーから受け取ったゲーム状態をクライアント側に反映
      gameState.initFromServer(data.gameState);

      // TODO: CommentaryAreaにログを追加
      // addCommentaryMessage('ゲームを開始します')
      // const isFirstPlayer = data.yourPlayerIndex === data.gameState.currentPlayerIndex
      // addCommentaryMessage(isFirstPlayer ? 'あなたの先攻です' : '相手の先攻です')
    };

    // ゲスト参加通知を受信（ホストのみ）
    const handlePlayerJoined = (data: { playerName: string; playerId: string }) => {
      console.log('プレイヤーが参加しました:', data);
      setOpponentPlayerName(data.playerName);
    };

    // エラーイベント
    const handleError = (error: any) => {
      console.error('Socket.io エラー:', error);
      // TODO: エラーメッセージをユーザーに表示
      // 準備完了状態をリセット
      if (error.code === 'NOT_IN_ROOM' || error.code === 'ROOM_NOT_FOUND') {
        setIsReady(false);
        setIsWaitingForGameStart(false);
      }
    };

    socket.on('gameStart', handleGameStart);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('error', handleError);

    return () => {
      socket.off('gameStart', handleGameStart);
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('error', handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomId, playerId]);

  return {
    // オンラインゲーム固有の状態
    isReady,
    isWaitingForGameStart,
    opponentPlayerName,
    gameStarted,

    // アクション
    sendReady,

    // ゲーム状態
    ...gameState,
  };
}
