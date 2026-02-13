import { useEffect, useState, useCallback } from 'react';
import { useGameState } from './useGameState';
import { socket } from '../lib/socket';
import type { GameStartPayload } from '../lib/socket';
import type { CommentaryMessage } from '../types/Commentary';
import { CommentaryBuilder } from '../types/Commentary';

interface UseOnlineGameOptions {
  roomId: string | null;
  playerId: string | null;
  role: 'host' | 'guest' | null;
  playerName: string | null;
  enabled?: boolean; // オンラインモードが有効かどうか
  onAddMessage?: (message: CommentaryMessage) => void; // ゲームログメッセージを追加するコールバック
  onShowError?: (message: string) => void; // エラーメッセージを表示するコールバック
}

interface RoomJoinedPayload {
  roomId: string;
  playerId: string;
  role: 'host' | 'guest';
  roomInfo: {
    hostPlayerName: string;
    guestPlayerName: string | null;
    status: string;
  };
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
  initFromServer: ReturnType<typeof useGameState>['initFromServer'];
}

/**
 * オンラインゲーム用のカスタムフック
 * Socket.ioの通信とゲーム状態管理を統合
 */
export function useOnlineGame({
  roomId,
  playerId,
  role,
  enabled = true,
  onAddMessage,
  onShowError,
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
      console.log('準備完了のレスポンス:', response);
      if (response?.success || response?.gameState) {
        setIsReady(true);
        // gameStateが返ってきた場合は両プレイヤーが準備完了している
        setIsWaitingForGameStart(response?.gameState ? false : true);
        console.log('準備完了しました');

        // 準備完了メッセージを表示
        if (response?.gameState) {
          // 両方準備完了の場合は、handleGameStartで表示されるのでここでは何もしない
          console.log('両方準備完了: handleGameStartでメッセージ表示');
        } else {
          // 自分だけ準備完了した場合
          console.log('自分だけ準備完了: メッセージを表示');
          onAddMessage?.(
            CommentaryBuilder.createMessage(
              'turn',
              '⏳',
              '準備完了しました。対戦相手の準備を待っています...'
            )
          );
        }
      } else if (response?.code) {
        // エラーレスポンス
        const errorMessage = response?.message || response?.code || '準備完了に失敗しました';
        console.error('準備完了に失敗:', errorMessage);
        onShowError?.(errorMessage);
      } else {
        console.error('準備完了に失敗:', response);
        onShowError?.('準備完了に失敗しました');
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
      console.log('gameState:', data.gameState);
      console.log('yourPlayerIndex:', data.yourPlayerIndex);

      setIsWaitingForGameStart(false);
      setGameStarted(true);

      // サーバーから受け取ったゲーム状態をクライアント側に反映
      try {
        gameState.initFromServer(data.gameState);
        console.log('ゲーム状態の初期化成功');
      } catch (error) {
        console.error('ゲーム状態の初期化エラー:', error);
        onShowError?.('ゲーム状態の初期化に失敗しました');
        return;
      }

      // CommentaryAreaにログを追加
      onAddMessage?.(CommentaryBuilder.gameStart());

      const isFirstPlayer = data.yourPlayerIndex === data.gameState.currentPlayerIndex;
      onAddMessage?.(
        CommentaryBuilder.createMessage(
          'turn',
          '👤',
          isFirstPlayer ? 'あなたの先攻です' : '相手の先攻です'
        )
      );
    };

    // ゲスト参加通知を受信（ホストのみ）
    const handlePlayerJoined = (data: { playerName: string; playerId: string }) => {
      console.log('プレイヤーが参加しました:', data);
      setOpponentPlayerName(data.playerName);
    };

    // 部屋参加成功通知を受信（ゲストのみ）
    const handleRoomJoined = (data: RoomJoinedPayload) => {
      console.log('部屋に参加しました:', data);
      // ゲスト側の場合、ホストの名前を取得
      if (role === 'guest' && data.roomInfo.hostPlayerName) {
        console.log('ホストの名前を設定:', data.roomInfo.hostPlayerName);
        setOpponentPlayerName(data.roomInfo.hostPlayerName);
      }
    };

    // エラーイベント
    const handleError = (error: any) => {
      console.error('Socket.io エラー:', error);

      // エラーメッセージをユーザーに表示
      const errorMessage = error.message || error.code || 'エラーが発生しました';
      onShowError?.(errorMessage);

      // 準備完了状態をリセット
      if (error.code === 'NOT_IN_ROOM' || error.code === 'ROOM_NOT_FOUND') {
        setIsReady(false);
        setIsWaitingForGameStart(false);
      }
    };

    socket.on('gameStart', handleGameStart);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('error', handleError);

    return () => {
      socket.off('gameStart', handleGameStart);
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('error', handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomId, playerId, role]);

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
