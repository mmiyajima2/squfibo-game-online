import { useEffect, useState, useCallback } from 'react';
import { useGameState } from './useGameState';
import { socket } from '../lib/socket';
import type { GameStartPayload } from '../lib/socket';
import type { CommentaryMessage } from '../types/Commentary';
import { CommentaryBuilder } from '../types/Commentary';
import type { Position } from 'squfibo-shared';

interface UseOnlineGameOptions {
  roomId: string | null;
  playerId: string | null;
  role: 'host' | 'guest' | null;
  playerName: string | null;
  enabled?: boolean; // オンラインモードが有効かどうか
  onAddMessage?: (message: CommentaryMessage) => void; // ゲームログメッセージを追加するコールバック
  onShowError?: (message: string) => void; // エラーメッセージを表示するコールバック
  onOpponentLeft?: () => void; // 相手が退出した際のコールバック
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

// サーバー → クライアントのペイロード型定義
interface CardRemovedPayload {
  playerId: string;
  position: { row: number; col: number };
  card: {
    id: string;
    value: number;
    color: string;
  };
}

interface ComboResolvedPayload {
  playerId: string;
  combo: any; // ComboDTO
  starsAwarded: number;
  cardsDrawn: number;
}

interface TurnEndedPayload {
  playerId: string;
  placedCard: any; // CardDTO
  position: { row: number; col: number };
}

interface TurnChangedPayload {
  currentPlayerIndex: 0 | 1;
  currentPlayerId: string;
}

interface GameStateUpdatePayload {
  gameState: any; // GameStateDTO
  updateType: 'card_placed' | 'card_removed' | 'combo_resolved' | 'turn_changed';
}

interface UseOnlineGameReturn {
  // オンラインゲーム固有の状態
  isReady: boolean;
  isWaitingForGameStart: boolean;
  opponentPlayerName: string | null;
  gameStarted: boolean;
  yourPlayerIndex: 0 | 1 | null;

  // アクション
  sendReady: () => void;
  leaveRoom: () => void;
  claimComboToServer: (
    cardId: string | null,
    position: Position,
    comboPositions: Position[]
  ) => void;
  endTurnToServer: (cardId: string | null, position: Position) => void;
  removeCardToServer: (position: Position) => void;

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
  onOpponentLeft,
}: UseOnlineGameOptions): UseOnlineGameReturn {
  const [isReady, setIsReady] = useState(false);
  const [isWaitingForGameStart, setIsWaitingForGameStart] = useState(false);
  const [opponentPlayerName, setOpponentPlayerName] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [yourPlayerIndex, setYourPlayerIndex] = useState<0 | 1 | null>(null);

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
  }, [roomId, playerId, onAddMessage, onShowError]);

  /**
   * 部屋から退出
   */
  const leaveRoom = useCallback(() => {
    if (!roomId || !playerId) {
      console.error('roomId or playerId is missing');
      return;
    }

    console.log('部屋から退出:', { roomId, playerId });
    socket.emit('leaveRoom', { roomId, playerId }, (response: any) => {
      console.log('退出のレスポンス:', response);
      if (response?.success) {
        console.log('部屋から退出しました');
        // 退出成功後の処理は親コンポーネント（Game.tsx）で行う
      } else if (response?.code) {
        // エラーレスポンス
        const errorMessage = response?.message || response?.code || '退出に失敗しました';
        console.error('退出に失敗:', errorMessage);
        onShowError?.(errorMessage);
      }
    });
  }, [roomId, playerId, onShowError]);

  /**
   * 役申告をサーバーに送信
   */
  const claimComboToServer = useCallback(
    (cardId: string | null, position: Position, comboPositions: Position[]) => {
      if (!roomId || !playerId) {
        console.error('roomId or playerId is missing');
        onShowError?.('オンライン接続情報が不足しています');
        return;
      }

      const payload = {
        roomId,
        playerId,
        cardId,
        position: { row: position.row, col: position.col },
        comboPositions: comboPositions.map((p) => ({ row: p.row, col: p.col })),
      };

      console.log('役申告を送信:', payload);
      socket.emit('claimCombo', payload, (response: any) => {
        if (response?.code) {
          // エラーレスポンス
          const errorMessage = response?.message || '役の申告に失敗しました';
          console.error('役申告エラー:', errorMessage);
          onShowError?.(errorMessage);
        }
      });
    },
    [roomId, playerId, onShowError]
  );

  /**
   * ターン終了をサーバーに送信
   */
  const endTurnToServer = useCallback(
    (cardId: string | null, position: Position) => {
      if (!roomId || !playerId) {
        console.error('roomId or playerId is missing');
        onShowError?.('オンライン接続情報が不足しています');
        return;
      }

      const payload = {
        roomId,
        playerId,
        cardId,
        position: { row: position.row, col: position.col },
      };

      console.log('ターン終了を送信:', payload);
      socket.emit('endTurn', payload, (response: any) => {
        if (response?.code) {
          // エラーレスポンス
          const errorMessage = response?.message || 'ターン終了に失敗しました';
          console.error('ターン終了エラー:', errorMessage);
          onShowError?.(errorMessage);
        }
      });
    },
    [roomId, playerId, onShowError]
  );

  /**
   * カード除去をサーバーに送信
   */
  const removeCardToServer = useCallback(
    (position: Position) => {
      if (!roomId || !playerId) {
        console.error('roomId or playerId is missing');
        onShowError?.('オンライン接続情報が不足しています');
        return;
      }

      const payload = {
        roomId,
        playerId,
        position: { row: position.row, col: position.col },
      };

      console.log('カード除去を送信:', payload);
      socket.emit('removeCard', payload, (response: any) => {
        if (response?.code) {
          // エラーレスポンス
          const errorMessage = response?.message || 'カード除去に失敗しました';
          console.error('カード除去エラー:', errorMessage);
          onShowError?.(errorMessage);
        }
      });
    },
    [roomId, playerId, onShowError]
  );

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
      setYourPlayerIndex(data.yourPlayerIndex);

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

    // ゲーム状態更新イベント
    const handleGameStateUpdate = (data: GameStateUpdatePayload) => {
      console.log('ゲーム状態更新:', data);
      try {
        gameState.initFromServer(data.gameState);
        console.log('ゲーム状態を更新しました');
      } catch (error) {
        console.error('ゲーム状態更新エラー:', error);
        onShowError?.('ゲーム状態の更新に失敗しました');
      }
    };

    // ターン切り替えイベント
    const handleTurnChanged = (data: TurnChangedPayload) => {
      console.log('ターン切り替え:', data);
      // ゲーム状態更新イベントで自動的に反映されるため、ここでは追加処理のみ
      const isMyTurn = data.currentPlayerId === playerId;
      onAddMessage?.(
        CommentaryBuilder.createMessage(
          'turn',
          '🔄',
          isMyTurn ? 'あなたのターンです' : '相手のターンです'
        )
      );
    };

    // ターン終了イベント
    const handleTurnEnded = (data: TurnEndedPayload) => {
      console.log('ターン終了:', data);
      const isMyAction = data.playerId === playerId;
      const message = isMyAction
        ? 'カードを配置してターンを終了しました'
        : '相手がカードを配置しました';
      onAddMessage?.(CommentaryBuilder.createMessage('action', '📍', message));
    };

    // 役解決イベント
    const handleComboResolved = (data: ComboResolvedPayload) => {
      console.log('役解決:', data);
      const isMyAction = data.playerId === playerId;
      const message = isMyAction
        ? `役が成立しました！ 星を${data.starsAwarded}個獲得`
        : `相手が役を成立させました（星${data.starsAwarded}個獲得）`;
      onAddMessage?.(CommentaryBuilder.createMessage('combo', '⭐', message));
    };

    // カード除去イベント
    const handleCardRemoved = (data: CardRemovedPayload) => {
      console.log('カード除去:', data);
      const isMyAction = data.playerId === playerId;
      const message = isMyAction ? 'カードを除去しました' : '相手がカードを除去しました';
      onAddMessage?.(CommentaryBuilder.createMessage('action', '🗑️', message));
    };

    // 相手退出イベント
    const handlePlayerLeft = (data: { playerId: string; playerName: string }) => {
      console.log('相手が退出しました:', data);
      const isMyAction = data.playerId === playerId;
      if (!isMyAction) {
        onAddMessage?.(
          CommentaryBuilder.createMessage('turn', '🚪', `${data.playerName} が退出しました`)
        );
        onOpponentLeft?.();
      }
    };

    socket.on('gameStart', handleGameStart);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('error', handleError);
    socket.on('gameStateUpdate', handleGameStateUpdate);
    socket.on('turnChanged', handleTurnChanged);
    socket.on('turnEnded', handleTurnEnded);
    socket.on('comboResolved', handleComboResolved);
    socket.on('cardRemoved', handleCardRemoved);
    socket.on('playerLeft', handlePlayerLeft);

    return () => {
      socket.off('gameStart', handleGameStart);
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('error', handleError);
      socket.off('gameStateUpdate', handleGameStateUpdate);
      socket.off('turnChanged', handleTurnChanged);
      socket.off('turnEnded', handleTurnEnded);
      socket.off('comboResolved', handleComboResolved);
      socket.off('cardRemoved', handleCardRemoved);
      socket.off('playerLeft', handlePlayerLeft);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomId, playerId, role]);

  return {
    // オンラインゲーム固有の状態
    isReady,
    isWaitingForGameStart,
    opponentPlayerName,
    gameStarted,
    yourPlayerIndex,

    // アクション
    sendReady,
    leaveRoom,
    claimComboToServer,
    endTurnToServer,
    removeCardToServer,

    // ゲーム状態
    ...gameState,
  };
}
