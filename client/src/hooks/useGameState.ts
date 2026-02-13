import { useReducer, useCallback } from 'react';
import { Game } from '../domain/Game';
import { Card } from '../domain/entities/Card';
import type { Position } from 'squfibo-shared';
import { Combo } from '../domain/services/Combo';
import type { GameStateDTO } from 'squfibo-shared';

interface GameStateHook {
  game: Game;
  version: number;
  currentPlayerIndex: 0 | 1;
  hasGameStarted: boolean;
  placeCardFromHand: (card: Card, position: Position) => void;
  claimCombo: (combo: Combo) => boolean;
  endTurn: () => void;
  discardFromBoard: (position: Position) => void;
  discardFromHand: (card: Card) => void;
  drawAndPlaceCard: (position: Position) => Card | null;
  resetGame: (playerGoesFirst?: boolean) => void;
  cancelPlacement: (position: Position) => void;
  initFromServer: (gameState: GameStateDTO) => void;
}

type GameAction =
  | { type: 'PLACE_CARD'; card: Card; position: Position }
  | { type: 'CLAIM_COMBO'; combo: Combo }
  | { type: 'END_TURN' }
  | { type: 'DISCARD_FROM_BOARD'; position: Position }
  | { type: 'DISCARD_FROM_HAND'; card: Card }
  | { type: 'DRAW_AND_PLACE'; position: Position }
  | { type: 'RESET_GAME'; playerGoesFirst?: boolean }
  | { type: 'CANCEL_PLACEMENT'; position: Position }
  | { type: 'INIT_FROM_SERVER'; gameState: GameStateDTO };

interface GameStateWrapper {
  game: Game;
  version: number;
  currentPlayerIndexSnapshot: 0 | 1;
  hasGameStarted: boolean;
}

function gameReducer(state: GameStateWrapper, action: GameAction): GameStateWrapper {
  const { game } = state;

  switch (action.type) {
    case 'PLACE_CARD': {
      const currentPlayer = game.getCurrentPlayer();

      // カードが手札にあるかチェック（React Strict Modeでの2重実行対策）
      const cardInHand = currentPlayer.hand.getCards().find(c => c.id === action.card.id);
      if (!cardInHand) {
        // 既に配置済みの場合はスキップ
        return state;
      }

      const playedCard = currentPlayer.playCard(action.card);
      game.placeCard(playedCard, action.position);
      return { ...state, version: state.version + 1, currentPlayerIndexSnapshot: state.currentPlayerIndexSnapshot, hasGameStarted: state.hasGameStarted };
    }

    case 'CLAIM_COMBO': {
      // React Strict Modeの二重実行対策
      // コンボの位置にまだカードが存在するか確認（既にクレーム済みの場合はスキップ）
      const hasCardsAtPositions = action.combo.positions.some(pos => !game.board.isEmpty(pos));
      if (!hasCardsAtPositions) {
        // 全ての位置が既に空 = 既にクレーム済み
        // snapshotをgameの現在の状態に同期させる
        const currentIndex = game.getCurrentPlayer().id === 'player1' ? 0 : 1;
        return { ...state, version: state.version + 1, currentPlayerIndexSnapshot: currentIndex as 0 | 1 };
      }

      game.claimCombo(action.combo);

      // 役申告成功後は自動的にターンを終了
      game.endTurn();
      const afterIndex = game.getCurrentPlayer().id === 'player1' ? 0 : 1;
      return { ...state, version: state.version + 1, currentPlayerIndexSnapshot: afterIndex as 0 | 1, hasGameStarted: state.hasGameStarted };
    }

    case 'END_TURN': {
      // React Strict Modeの二重実行対策
      const beforeIndex = game.getCurrentPlayer().id === 'player1' ? 0 : 1;

      console.log('[END_TURN] Action received', {
        beforeIndex,
        snapshot: state.currentPlayerIndexSnapshot,
        version: state.version
      });

      // gameの状態とsnapshotが一致しない場合、1回目の実行で既にターンが切り替わっている
      // 2回目の実行では、snapshotをgameの現在の状態に同期させる
      if (beforeIndex !== state.currentPlayerIndexSnapshot) {
        console.log('[END_TURN] Skipped (snapshot mismatch)');
        return { ...state, version: state.version + 1, currentPlayerIndexSnapshot: beforeIndex as 0 | 1 };
      }

      game.endTurn();
      const afterIndex = game.getCurrentPlayer().id === 'player1' ? 0 : 1;
      console.log('[END_TURN] Turn ended', {
        afterIndex,
        newVersion: state.version + 1
      });
      return { ...state, version: state.version + 1, currentPlayerIndexSnapshot: afterIndex as 0 | 1, hasGameStarted: state.hasGameStarted };
    }

    case 'DISCARD_FROM_BOARD': {
      // 既に空の場合はスキップ（React Strict Modeでの2重実行対策）
      if (game.board.isEmpty(action.position)) {
        return state;
      }
      game.discardFromBoard(action.position);
      return { ...state, version: state.version + 1, currentPlayerIndexSnapshot: state.currentPlayerIndexSnapshot, hasGameStarted: state.hasGameStarted };
    }

    case 'DISCARD_FROM_HAND': {
      const currentPlayer = game.getCurrentPlayer();
      // カードが手札にあるかチェック（React Strict Modeでの2重実行対策）
      const cardInHand = currentPlayer.hand.getCards().find(c => c.id === action.card.id);
      if (!cardInHand) {
        // 既に廃棄済みの場合はスキップ
        return state;
      }
      game.discardFromHand(action.card);
      return { ...state, version: state.version + 1, currentPlayerIndexSnapshot: state.currentPlayerIndexSnapshot, hasGameStarted: state.hasGameStarted };
    }

    case 'DRAW_AND_PLACE': {
      // 既にカードがある場合はスキップ（React Strict Modeでの2重実行対策）
      if (!game.board.isEmpty(action.position)) {
        return state;
      }
      game.drawAndPlaceCard(action.position);
      return { ...state, version: state.version + 1, currentPlayerIndexSnapshot: state.currentPlayerIndexSnapshot, hasGameStarted: state.hasGameStarted };
    }

    case 'RESET_GAME': {
      const playerGoesFirst = action.playerGoesFirst !== undefined ? action.playerGoesFirst : true;
      return {
        game: Game.createNewGame(playerGoesFirst),
        version: 0,
        currentPlayerIndexSnapshot: playerGoesFirst ? 0 : 1,
        hasGameStarted: true,
      };
    }

    case 'CANCEL_PLACEMENT': {
      // ボードが既に空の場合はスキップ（React Strict Modeでの2重実行対策）
      if (game.board.isEmpty(action.position)) {
        return state;
      }

      const card = game.board.removeCard(action.position);
      if (card) {
        const currentPlayer = game.getCurrentPlayer();
        currentPlayer.drawToHand(card);
      }
      return { ...state, version: state.version + 1, currentPlayerIndexSnapshot: state.currentPlayerIndexSnapshot, hasGameStarted: state.hasGameStarted };
    }

    case 'INIT_FROM_SERVER': {
      // サーバーから受け取ったGameStateDTOからGameオブジェクトを構築
      const game = Game.fromServerState(action.gameState);
      return {
        game,
        version: 0,
        currentPlayerIndexSnapshot: action.gameState.currentPlayerIndex,
        hasGameStarted: true,
      };
    }

    default:
      return state;
  }
}

function createInitialState(): GameStateWrapper {
  return {
    game: Game.createNewGame(),
    version: 0,
    currentPlayerIndexSnapshot: 0,
    hasGameStarted: false,
  };
}

export function useGameState(): GameStateHook {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  const placeCardFromHand = useCallback((card: Card, position: Position) => {
    dispatch({ type: 'PLACE_CARD', card, position });
  }, []);

  const claimCombo = useCallback((combo: Combo): boolean => {
    try {
      dispatch({ type: 'CLAIM_COMBO', combo });
      return true;
    } catch (error) {
      console.error('Failed to claim combo:', error);
      return false;
    }
  }, []);

  const endTurn = useCallback(() => {
    dispatch({ type: 'END_TURN' });
  }, []);

  const discardFromBoard = useCallback((position: Position) => {
    dispatch({ type: 'DISCARD_FROM_BOARD', position });
  }, []);

  const discardFromHand = useCallback((card: Card) => {
    dispatch({ type: 'DISCARD_FROM_HAND', card });
  }, []);

  const drawAndPlaceCard = useCallback((position: Position): Card | null => {
    try {
      dispatch({ type: 'DRAW_AND_PLACE', position });
      // 注: Reducerの後に状態が更新されるため、ここでは正確なカードを返せない
      // 必要に応じて、stateから取得する必要がある
      return null;
    } catch (error) {
      console.error('Failed to draw and place card:', error);
      return null;
    }
  }, []);

  const resetGame = useCallback((playerGoesFirst?: boolean) => {
    dispatch({ type: 'RESET_GAME', playerGoesFirst });
  }, []);

  const cancelPlacement = useCallback((position: Position) => {
    dispatch({ type: 'CANCEL_PLACEMENT', position });
  }, []);

  const initFromServer = useCallback((gameState: GameStateDTO) => {
    dispatch({ type: 'INIT_FROM_SERVER', gameState });
  }, []);

  return {
    game: state.game,
    version: state.version,
    currentPlayerIndex: state.currentPlayerIndexSnapshot,
    hasGameStarted: state.hasGameStarted,
    placeCardFromHand,
    claimCombo,
    endTurn,
    discardFromBoard,
    discardFromHand,
    drawAndPlaceCard,
    resetGame,
    cancelPlacement,
    initFromServer,
  };
}
