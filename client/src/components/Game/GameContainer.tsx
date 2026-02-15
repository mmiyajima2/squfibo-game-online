import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useUIState } from '../../hooks/useUIState';
import { useCommentary } from '../../hooks/useCommentary';
import type { Position } from 'squfibo-shared';
import { positionEquals } from 'squfibo-shared';
import { Card } from '../../domain/entities/Card';
import { CardColor } from 'squfibo-shared';
import { ComboDetector } from '../../domain/services/ComboDetector';
import { Combo } from '../../domain/services/Combo';
import { BoardGrid } from '../Board/BoardGrid';
import { HandArea } from '../Hand/HandArea';
import { GameStatus } from './GameStatus';
import { CommentaryArea } from '../Commentary/CommentaryArea';
import { ComboRulesPanel } from '../ComboRules/ComboRulesPanel';
import { ControlPanel } from './ControlPanel';
import { CommentaryBuilder } from '../../types/Commentary';
import './GameContainer.css';
import '../ComboRules/ComboRulesPanel.css';

type GameContainerProps = {
  isOnlineMode?: boolean
  role?: 'host' | 'guest' | null
  playerName?: string | null
  opponentPlayerName?: string | null
  isReady?: boolean
  isWaitingForGameStart?: boolean
  onReady?: () => void
  guestUrlField?: React.ReactNode
  yourPlayerIndex?: 0 | 1 | null
  // オンラインゲームの状態（オプショナル）
  onlineGameState?: ReturnType<typeof import('../../hooks/useGameState').useGameState>
  // オンライン時のコメンタリーとUIステート（オプショナル）
  onlineCommentary?: ReturnType<typeof import('../../hooks/useCommentary').useCommentary>
  onlineUIState?: ReturnType<typeof import('../../hooks/useUIState').useUIState>
  // オンライン時のSocket.io送信メソッド（オプショナル）
  claimComboToServer?: (
    cardId: string | null,
    position: Position,
    comboPositions: Position[]
  ) => void
  endTurnToServer?: (cardId: string | null, position: Position) => void
  removeCardToServer?: (position: Position) => void
}

export function GameContainer({
  isOnlineMode = false,
  role = null,
  playerName = null,
  opponentPlayerName = null,
  isReady = false,
  isWaitingForGameStart = false,
  onReady,
  guestUrlField,
  yourPlayerIndex = null,
  onlineGameState,
  onlineCommentary,
  onlineUIState,
  claimComboToServer,
  endTurnToServer,
  removeCardToServer: _removeCardToServer,
}: GameContainerProps = {}) {
  const localGameState = useGameState();
  const localCommentary = useCommentary();
  const localUIState = useUIState();

  // オンラインモードでonlineGameStateが渡された場合はそちらを使用
  const { game, hasGameStarted, placeCardFromHand, claimCombo, endTurn, discardFromBoard, drawAndPlaceCard, resetGame, cancelPlacement } =
    onlineGameState || localGameState;

  // オンラインモードでonlineCommentaryが渡された場合はそちらを使用
  const { messages, addMessage, updateCurrent, clearMessages } = onlineCommentary || localCommentary;

  // オンラインモードでonlineUIStateが渡された場合はそちらを使用
  const {
    selectedCard,
    selectCard,
    selectedBoardCards,
    toggleBoardCardSelection,
    clearBoardCardSelection,
    highlightedPositions,
    highlightPositions,
    clearHighlight,
    errorMessage,
    showError,
    clearError,
    placementHistory,
    addPlacementHistory,
    removeLastPlacement,
    clearPlacementHistory
  } = onlineUIState || localUIState;

  const [showComboRules, setShowComboRules] = useState(true);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const comboDetector = useMemo(() => new ComboDetector(), []);
  const currentPlayer = game.getCurrentPlayer();

  // オンラインモードではインデックスで、オフラインモードではIDでターンを判定
  const isPlayer1Turn = isOnlineMode
    ? game.currentPlayerIndex === 0
    : currentPlayer.id === 'player1';

  // オンラインモードで自分のターンかどうかを判定
  const isMyTurn = useMemo(() => {
    if (!isOnlineMode) {
      // オフラインモードの場合は常にtrue（両方のプレイヤーを操作可能）
      return true;
    }
    // オンラインモードの場合、yourPlayerIndexを使用して判定
    if (yourPlayerIndex === null) {
      return false;
    }
    return game.currentPlayerIndex === yourPlayerIndex;
  }, [isOnlineMode, yourPlayerIndex, game.currentPlayerIndex]);

  // 選択されたカードが役を形成しているか検証
  const isValidCombo = useMemo(() => {
    if (selectedBoardCards.length < 2 || selectedBoardCards.length > 3) {
      return false;
    }

    const positions: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const pos = { row: row, col: col };
        const card = game.board.getCard(pos);
        if (card && selectedBoardCards.some(sc => sc.id === card.id)) {
          positions.push(pos);
        }
      }
    }

    const verifiedComboType = comboDetector.checkCombo(selectedBoardCards, positions);
    return verifiedComboType !== null;
  }, [selectedBoardCards, game.board, comboDetector]);

  // StrictModeでの二重実行を防ぐためのref
  const hasInitialized = useRef(false);

  // 初回レンダリング時のメッセージ表示
  useEffect(() => {
    if (!hasInitialized.current) {
      // オンラインモードの場合、メッセージはuseOnlineGameで管理されるのでここでは何もしない
      if (isOnlineMode) {
        hasInitialized.current = true;
        return;
      }

      if (hasGameStarted) {
        addMessage(CommentaryBuilder.gameStart());
        updateCurrent('下側のターンです');
      } else {
        updateCurrent('「新しいゲーム」ボタンを押してゲームを開始してください');
      }
      hasInitialized.current = true;
    }
  }, [hasGameStarted, isOnlineMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // エラーメッセージを3秒後に自動的にクリア
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        clearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, clearError]);

  // ターン切り替えを監視して実況を更新（オフラインモードのみ）
  const prevIsPlayer1Turn = useRef(isPlayer1Turn);
  useEffect(() => {
    // オンラインモードではuseOnlineGameがターン切り替えメッセージを管理するのでスキップ
    if (isOnlineMode) return;

    // 初回レンダリングはスキップ（hasInitialized.currentで判定）
    if (prevIsPlayer1Turn.current !== isPlayer1Turn && hasInitialized.current) {
      const message = isPlayer1Turn
        ? CommentaryBuilder.lowerPlayerTurn()
        : CommentaryBuilder.upperPlayerTurn();
      addMessage(message);
      updateCurrent(message.text);

      // 自動ドローの実況メッセージ
      const autoDrawnPlayerId = game.getLastAutoDrawnPlayerId();
      if (autoDrawnPlayerId) {
        const playerName = autoDrawnPlayerId === 'player1' ? '下側' : '上側';
        addMessage(
          CommentaryBuilder.createMessage(
            'draw',
            '🎴',
            `${playerName}の手札が0枚だったため、山札から1枚自動ドローしました`
          )
        );
        game.clearAutoDrawFlag();
      }

      // ターン切り替え時に配置履歴をクリア（配置を示す効果を消す）
      clearPlacementHistory();
    }
    prevIsPlayer1Turn.current = isPlayer1Turn;
  }, [isPlayer1Turn, addMessage, updateCurrent, clearPlacementHistory, game, isOnlineMode]);

  const handleCardSelect = (card: Card) => {
    if (!hasGameStarted) return;

    // オンラインモードで自分のターンでない場合は操作不可
    if (isOnlineMode && !isMyTurn) {
      showError('自分のターンではありません');
      return;
    }

    if (selectedCard?.equals(card)) {
      selectCard(null);
      clearHighlight();
    } else {
      // 手札から同じIDのカードを探す
      const cardInHand = currentPlayer.hand.getCards().find(c => c.id === card.id);
      if (cardInHand) {
        selectCard(cardInHand);
        // 配置可能なセル（空のセル）をハイライト表示
        const emptyPositions: Position[] = [];
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const pos = { row: row, col: col };
            if (game.board.isEmpty(pos)) {
              emptyPositions.push(pos);
            }
          }
        }
        highlightPositions(emptyPositions);
      }
    }
  };

  const handleDeleteBoardCard = (position: Position) => {
    // オンラインモードで自分のターンでない場合は操作不可
    if (isOnlineMode && !isMyTurn) {
      showError('自分のターンではありません');
      return;
    }

    const card = game.board.getCard(position);
    if (!card) {
      showError('そのマスにはカードがありません');
      return;
    }

    const cardColor = card.color === CardColor.RED ? '赤' : '青';
    const cardValue = card.value;

    const confirmed = window.confirm(`盤面の${cardColor}${cardValue} を捨てますか？`);
    if (!confirmed) {
      return;
    }

    try {
      discardFromBoard(position);
      addMessage(CommentaryBuilder.createMessage('discard', '🗑️', `盤面の${cardColor}${cardValue}を廃棄しました`));

      clearError();
    } catch (error) {
      console.error('Failed to discard card from board:', error);
      showError('カードの廃棄に失敗しました');
    }
  };

  const handleCellClick = (position: Position) => {
    if (!hasGameStarted) return;

    // オンラインモードで自分のターンでない場合は操作不可
    if (isOnlineMode && !isMyTurn) {
      showError('自分のターンではありません');
      return;
    }

    // 1ターンに1枚のみ配置可能
    if (placementHistory.length >= 1) {
      showError('1ターンに配置できるカードは1枚のみです');
      return;
    }

    if (!game.board.isEmpty(position)) {
      showError('そのマスには既にカードが配置されています');
      return;
    }

    const currentPlayer = game.getCurrentPlayer();
    const hasHandCards = currentPlayer.hand.hasCards();

    // 手札が0枚の場合、山札から直接引いて配置
    if (!hasHandCards) {
      if (game.deck.isEmpty()) {
        showError('山札が空です');
        return;
      }

      try {
        drawAndPlaceCard(position);
        const placedCard = game.board.getCard(position);
        if (placedCard) {
          addPlacementHistory(placedCard, position);
        }
        addMessage(CommentaryBuilder.createMessage('draw', '🎴', '山札から直接カードを配置しました'));
        clearError();
      } catch (error) {
        console.error('Failed to draw and place card:', error);
        showError('山札からのカード配置に失敗しました');
      }
      return;
    }

    // 通常の配置処理（手札からカードを選択している場合）
    if (!selectedCard) {
      showError('手札からカードを選択してください');
      return;
    }

    try {
      const cardColor = selectedCard.color === CardColor.RED ? '赤' : '青';
      const cardValue = selectedCard.value;

      // 現在の手札から選択されたカードと同じIDのカードを探す
      const currentHand = game.getCurrentPlayer().hand.getCards();
      const cardToPlay = currentHand.find(c => c.id === selectedCard.id);

      if (!cardToPlay) {
        showError('選択されたカードが手札に見つかりません');
        return;
      }

      placeCardFromHand(cardToPlay, position);
      addPlacementHistory(cardToPlay, position);

      const message = isPlayer1Turn
        ? CommentaryBuilder.lowerPlayerPlacedCard(cardColor, cardValue)
        : CommentaryBuilder.upperPlayerPlacedCard(cardColor, cardValue);
      addMessage(message);

      selectCard(null);
      clearHighlight();
      clearError();
    } catch (error) {
      console.error('Failed to place card:', error);
      showError('カードの配置に失敗しました');
    }
  };

  const handleEndTurn = () => {
    // オンラインモードで自分のターンでない場合は操作不可
    if (isOnlineMode && !isMyTurn) {
      showError('自分のターンではありません');
      return;
    }

    // カードを配置していない場合はターン終了できない
    if (placementHistory.length === 0) {
      showError('カードを1枚配置してからターンを終了してください');
      return;
    }

    // オンラインモードの場合はサーバーに送信
    if (isOnlineMode && endTurnToServer) {
      const lastPlacement = placementHistory[placementHistory.length - 1];
      if (lastPlacement) {
        endTurnToServer(lastPlacement.card.id, lastPlacement.position);
        // ローカル状態の更新はgameStateUpdateイベントで行われるため、ここでは行わない
        clearPlacementHistory();
        selectCard(null);
      }
    } else {
      // オフラインモードの場合はローカル状態を更新
      endTurn();
      clearPlacementHistory();
      selectCard(null);
    }
  };

  const handleResetGame = () => {
    setShowGameOverModal(false);
    resetGame(true);
    clearMessages();
    addMessage(CommentaryBuilder.gameStart());
    updateCurrent('下側のターンです');
    selectCard(null);
    clearHighlight();
    clearBoardCardSelection();
    clearPlacementHistory();
  };

  const handleCancelCard = (position: Position) => {
    // オンラインモードで自分のターンでない場合は操作不可
    if (isOnlineMode && !isMyTurn) {
      showError('自分のターンではありません');
      return;
    }

    // 配置履歴からこのpositionのカードを探す
    const placement = placementHistory.find(ph => positionEquals(ph.position, position));

    if (!placement) {
      showError('取り消すカード配置がありません');
      return;
    }

    try {
      cancelPlacement(position);
      removeLastPlacement();

      const cardColor = placement.card.color === CardColor.RED ? '赤' : '青';
      const cardValue = placement.card.value;
      addMessage(
        CommentaryBuilder.createMessage(
          'cancel',
          '↩️',
          `${cardColor}${cardValue}の配置を取り消しました`
        )
      );
      clearError();
    } catch (error) {
      console.error('Failed to cancel placement:', error);
      showError('配置の取り消しに失敗しました');
    }
  };

  // 「役を申告」ボタンを押した時（モーダルなし、直接検証）
  const handleClaimCombo = () => {
    // オンラインモードで自分のターンでない場合は操作不可
    if (isOnlineMode && !isMyTurn) {
      showError('自分のターンではありません');
      return;
    }

    if (selectedBoardCards.length === 0) {
      showError('役を構成するカードを盤面から選択してください');
      return;
    }
    if (selectedBoardCards.length < 2 || selectedBoardCards.length > 3) {
      showError('役は2枚または3枚のカードで構成されます');
      clearBoardCardSelection();
      return;
    }

    // 盤面から選択したカードの位置を取得
    const positions: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const pos = { row: row, col: col };
        const card = game.board.getCard(pos);
        if (card && selectedBoardCards.some(sc => sc.id === card.id)) {
          positions.push(pos);
        }
      }
    }

    // 役を検証
    const verifiedComboType = comboDetector.checkCombo(selectedBoardCards, positions);

    if (verifiedComboType === null) {
      // 選択したカードは役ではない
      showError('おしい！選択したカードは役ではありません');
      clearBoardCardSelection();
      return;
    }

    // カードを配置していない場合は役を申告できない
    if (placementHistory.length === 0) {
      showError('カードを1枚配置してから役を申告してください');
      clearBoardCardSelection();
      return;
    }

    // このターンで配置したカードが役に含まれているかチェック
    const placedThisTurn = placementHistory.some(placement =>
      selectedBoardCards.some(selectedCard => selectedCard.id === placement.card.id)
    );

    if (!placedThisTurn) {
      showError('役には、今のターンで配置したカードを含める必要があります');
      clearBoardCardSelection();
      return;
    }

    // 正しい役が申告された
    // オンラインモードの場合はサーバーに送信
    if (isOnlineMode && claimComboToServer) {
      const lastPlacement = placementHistory[placementHistory.length - 1];
      if (lastPlacement) {
        claimComboToServer(lastPlacement.card.id, lastPlacement.position, positions);
        // ローカル状態の更新はgameStateUpdateイベントで行われるため、ここでは行わない
        clearPlacementHistory();
        clearBoardCardSelection();
        clearError();
        selectCard(null);
      }
    } else {
      // オフラインモードの場合はローカル状態を更新
      // 役申告前に現在のプレイヤーを保存（endTurnでターンが切り替わる前に）
      const claimingPlayer = game.getCurrentPlayer();
      const combo = new Combo(verifiedComboType, selectedBoardCards, positions);
      const success = claimCombo(combo);

      if (success) {
        const comboName = getComboTypeName(verifiedComboType);

        // 役申告の実況は申告したプレイヤーに基づく
        const comboMessage = claimingPlayer.id === 'player1'
          ? CommentaryBuilder.lowerPlayerClaimedCombo(comboName)
          : CommentaryBuilder.upperPlayerClaimedCombo(comboName);
        addMessage(comboMessage);


        clearPlacementHistory();
        clearBoardCardSelection();
        clearError();
        selectCard(null);

        // ターン終了はclaimComboアクション内で自動的に行われる
      } else {
        showError('役の申告に失敗しました');
      }
    }
  };

  const getComboTypeName = (comboType: string): string => {
    switch (comboType) {
      case 'THREE_CARDS':
        return '1-4-16（大役）';
      case 'TRIPLE_MATCH':
        return '同じ数字3枚（小役）';
      default:
        return '役';
    }
  };

  const player1 = game.players[0];
  const player2 = game.players[1];
  const isGameOver = game.isGameOver();
  const winner = game.getWinner();
  const isBoardFull = game.board.isFull();

  // オンラインモードのプレイヤー名表示
  // role === 'host' の場合: player1 = ホスト（下側）, player2 = ゲスト（上側）
  // role === 'guest' の場合: player1 = ホスト（下側）, player2 = ゲスト（上側）
  const player1Label = isOnlineMode && role === 'host'
    ? `${playerName}（ホスト）`
    : isOnlineMode && role === 'guest'
    ? opponentPlayerName
      ? `${opponentPlayerName}（ホスト）`
      : 'ホスト'
    : '下側の手札';

  const player2Label = isOnlineMode && role === 'guest'
    ? `${playerName}（ゲスト）`
    : isOnlineMode && role === 'host'
    ? opponentPlayerName
      ? `${opponentPlayerName}（ゲスト）`
      : 'ゲスト（待機中）'
    : '上側の手札';

  // 準備完了ボタンの表示判定
  // ホスト（role === 'host'）は下側の手札エリアに表示
  // ゲスト（role === 'guest'）は上側の手札エリアに表示
  const showReadyButtonForPlayer1 = isOnlineMode && role === 'host' && !isReady && !isWaitingForGameStart && !hasGameStarted;
  const showReadyButtonForPlayer2 = isOnlineMode && role === 'guest' && !isReady && !isWaitingForGameStart && !hasGameStarted;

  // ゲームオーバー時にモーダルを表示
  useEffect(() => {
    if (isGameOver) {
      setShowGameOverModal(true);
    }
  }, [isGameOver]);

  return (
    <div className="game-container">
      {isGameOver && showGameOverModal && (
        <div className="game-over-modal">
          <div className="game-over-content">
            <button
              className="modal-close-button"
              onClick={() => setShowGameOverModal(false)}
              aria-label="閉じる"
            >
              ×
            </button>
            <h2>ゲーム終了！</h2>
            {winner ? (
              <p className="winner-text">
                {winner.id === 'player1' ? '下側' : '上側'}の勝ち！
              </p>
            ) : (
              <p className="winner-text">引き分け！</p>
            )}
            <div className="final-scores">
              <div className="score-item">
                <span>上側:</span>
                <span className="score-value">★ {player2.stars}</span>
              </div>
              <div className="score-item">
                <span>下側:</span>
                <span className="score-value">★ {player1.stars}</span>
              </div>
            </div>
            <button className="new-game-button" onClick={handleResetGame}>
              新しいゲーム
            </button>
          </div>
        </div>
      )}
      <div className="game-header">
        <h1 className="game-title">SquFibo（すくふぃぼ）</h1>
        {!isOnlineMode && (
          <button className="reset-button" onClick={handleResetGame}>
            新しいゲーム
          </button>
        )}
      </div>

      <div className="game-content">
        <div className="opponent-area">
          <HandArea
            cards={hasGameStarted ? player2.hand.getCards() : []}
            selectedCard={
              isOnlineMode
                ? (role === 'guest' ? selectedCard : null)
                : (isPlayer1Turn ? null : selectedCard)
            }
            onCardClick={handleCardSelect}
            label={player2Label}
            isOpponent={role !== 'guest'}
            disabled={!hasGameStarted || (isOnlineMode && isWaitingForGameStart) || (isOnlineMode && role === 'host') || (isOnlineMode && role === 'guest' && !isMyTurn)}
            hideCardDetails={role !== 'guest'}
            readyButton={
              showReadyButtonForPlayer2 ? (
                <button className="ready-button" onClick={onReady}>
                  準備完了
                </button>
              ) : isWaitingForGameStart && role === 'guest' ? (
                <div className="waiting-message">準備完了しました。相手プレイヤーの準備を待っています...</div>
              ) : undefined
            }
            guestUrlField={guestUrlField}
          />
        </div>

        <div className="game-middle">
          <div className="status-board-commentary-container">
            <GameStatus
              game={game}
              isOnlineMode={isOnlineMode}
              role={role}
              playerName={playerName}
              opponentPlayerName={opponentPlayerName}
            />
            <div className="board-and-info-container">
              <BoardGrid
                board={game.board}
                highlightedPositions={highlightedPositions}
                selectedCards={selectedBoardCards}
                isValidCombo={isValidCombo}
                onCellClick={handleCellClick}
                onCardClick={toggleBoardCardSelection}
                showDeleteIcons={isBoardFull && !isGameOver && placementHistory.length === 0 && isMyTurn}
                onDeleteCard={handleDeleteBoardCard}
                showCancelIcons={placementHistory.length > 0}
                onCancelCard={handleCancelCard}
                placementHistory={placementHistory}
                disabled={!hasGameStarted || (isOnlineMode && !isMyTurn)}
              />
              <div className="info-display-area">
                {isBoardFull && placementHistory.length === 0 && (
                  <div className="board-full-notice">
                    ⚠️ 盤面が満杯です。盤面のカードのゴミ箱アイコンをクリックして廃棄するか、役を申告してください。
                  </div>
                )}
                {selectedCard && (
                  <div className="selected-card-info">
                    選択中: {selectedCard.color} {selectedCard.value}
                  </div>
                )}
                {selectedBoardCards.length > 0 && (
                  <div className="selected-board-cards-info">
                    申告用カード選択中: {selectedBoardCards.length}枚
                  </div>
                )}
                {errorMessage && (
                  <div className="error-message">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
            <ControlPanel
              onClaimCombo={handleClaimCombo}
              onEndTurn={handleEndTurn}
              isGameOver={isGameOver}
              disabled={!hasGameStarted || (isOnlineMode && !isMyTurn)}
            />
            {showComboRules ? (
              <ComboRulesPanel onClose={() => setShowComboRules(false)} />
            ) : (
              <button className="show-rules-button" onClick={() => setShowComboRules(true)}>
                役のルールを表示
              </button>
            )}
          </div>
        </div>

        <div className="player-area">
          <HandArea
            cards={hasGameStarted ? player1.hand.getCards() : []}
            selectedCard={
              isOnlineMode
                ? (role === 'host' ? selectedCard : null)
                : (isPlayer1Turn ? selectedCard : null)
            }
            onCardClick={handleCardSelect}
            label={player1Label}
            isOpponent={role !== 'host'}
            disabled={!hasGameStarted || (isOnlineMode && isWaitingForGameStart) || (isOnlineMode && role === 'guest') || (isOnlineMode && role === 'host' && !isMyTurn)}
            hideCardDetails={role !== 'host'}
            readyButton={
              showReadyButtonForPlayer1 ? (
                <button className="ready-button" onClick={onReady}>
                  準備完了
                </button>
              ) : isWaitingForGameStart && role === 'host' ? (
                <div className="waiting-message">準備完了しました。ゲストプレイヤーの参加を待っています...</div>
              ) : undefined
            }
          />
          <CommentaryArea messages={messages} />
        </div>
      </div>
    </div>
  );
}
