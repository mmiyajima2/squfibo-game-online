import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useUIState } from '../../hooks/useUIState';
import { useCommentary } from '../../hooks/useCommentary';
import { Position } from '../../domain/valueObjects/Position';
import { Card } from '../../domain/entities/Card';
import { CardColor } from '../../domain/valueObjects/CardColor';
import { ComboDetector } from '../../domain/services/ComboDetector';
import { Combo } from '../../domain/services/Combo';
import { BoardGrid } from '../Board/BoardGrid';
import { HandArea } from '../Hand/HandArea';
import { GameStatus } from './GameStatus';
import { CommentaryArea } from '../Commentary/CommentaryArea';
import { ComboRulesPanel } from '../ComboRules/ComboRulesPanel';
import { ControlPanel } from './ControlPanel';
import { CommentaryBuilder } from '../../types/Commentary';
import type { CPUDifficulty } from '../../types/CPUDifficulty';
import { CPU_DIFFICULTY_LABELS, CPU_DIFFICULTY_ENABLED } from '../../types/CPUDifficulty';
import type { CPUActionStep, CPUTurnPlan } from '../../domain/services/cpu';
import { CPUStrategyFactory } from '../../domain/services/cpu';
import './GameContainer.css';
import '../ComboRules/ComboRulesPanel.css';

export function GameContainer() {
  const { game, version, currentPlayerIndex, hasGameStarted, placeCardFromHand, claimCombo, endTurn, discardFromBoard, drawAndPlaceCard, resetGame, cancelPlacement, executeCPUStep } = useGameState();
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
  } = useUIState();
  const { messages, addMessage, updateCurrent, clearMessages } = useCommentary();

  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<CPUDifficulty>('Easy');
  const [playerGoesFirst, setPlayerGoesFirst] = useState(true);
  const [showComboRules, setShowComboRules] = useState(true);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const comboDetector = useMemo(() => new ComboDetector(), []);
  const currentPlayer = game.getCurrentPlayer();
  const isPlayer1Turn = currentPlayer.id === 'player1';

  // 選択されたカードが役を形成しているか検証
  const isValidCombo = useMemo(() => {
    if (selectedBoardCards.length < 2 || selectedBoardCards.length > 3) {
      return false;
    }

    const positions: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const pos = Position.of(row, col);
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

  // CPU実行状態の管理
  const [isCPUExecuting, setIsCPUExecuting] = useState(false);
  const [cpuStepsQueue, setCpuStepsQueue] = useState<CPUActionStep[]>([]);
  const cpuPlanRef = useRef<CPUTurnPlan | null>(null);

  // 初回レンダリング時のメッセージ表示
  useEffect(() => {
    if (!hasInitialized.current) {
      if (hasGameStarted) {
        addMessage(CommentaryBuilder.gameStart());
        updateCurrent('下側のターンです');
      } else {
        updateCurrent('「新しいゲーム」ボタンを押してゲームを開始してください');
      }
      hasInitialized.current = true;
    }
  }, [hasGameStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  // エラーメッセージを3秒後に自動的にクリア
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        clearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, clearError]);

  // ターン切り替えを監視して実況を更新
  const prevIsPlayer1Turn = useRef(isPlayer1Turn);
  useEffect(() => {
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
  }, [isPlayer1Turn, addMessage, updateCurrent, clearPlacementHistory, game]);

  // CPUターンのステップ実行
  const executeNextCPUStep = useCallback(() => {
    if (cpuStepsQueue.length === 0) {
      setIsCPUExecuting(false);
      cpuPlanRef.current = null;
      return;
    }

    const [nextStep, ...remainingSteps] = cpuStepsQueue;
    const cpuPlayerName = game.getCurrentPlayer().id === 'player1' ? '下側' : '上側';

    // 各ステップのメッセージと遅延
    let message = '';
    let delay = 0;

    switch (nextStep.type) {
      case 'REMOVE_CARD': {
        const card = game.board.getCard(nextStep.position);
        if (card) {
          const cardColor = card.color === CardColor.RED ? '赤' : '青';
          const cardValue = card.value.value;
          message = `${cpuPlayerName}が盤面の${cardColor}${cardValue}を除去しました`;
        }
        delay = 1000;
        break;
      }

      case 'PLACE_CARD': {
        const cardColor = nextStep.card.color === CardColor.RED ? '赤' : '青';
        const cardValue = nextStep.card.value.value;
        message = `${cpuPlayerName}が${cardColor}${cardValue}を配置しました`;
        delay = 1200;
        break;
      }

      case 'CLAIM_COMBO': {
        const comboName = getComboTypeName(nextStep.combo.type);
        message = `${cpuPlayerName}が${comboName}を申告しました！`;
        delay = 1500;
        break;
      }

      case 'END_TURN': {
        delay = 500;
        break;
      }
    }

    // メッセージがあれば追加
    if (message) {
      addMessage(CommentaryBuilder.createMessage('cpu', '🤖', message));
    }

    // ステップを実行
    setTimeout(() => {
      try {
        executeCPUStep(nextStep);
        setCpuStepsQueue(remainingSteps);
      } catch (error) {
        console.error('CPU step execution failed:', error);
        showError('CPUのステップ実行に失敗しました');
        setIsCPUExecuting(false);
        setCpuStepsQueue([]);
        cpuPlanRef.current = null;
      }
    }, delay);
  }, [cpuStepsQueue, game, addMessage, executeCPUStep, showError]);

  // CPUステップキューの監視
  useEffect(() => {
    if (isCPUExecuting) {
      executeNextCPUStep();
    }
  }, [isCPUExecuting, cpuStepsQueue, executeNextCPUStep]);

  // CPUターンの自動開始
  useEffect(() => {
    const currentPlayerInEffect = game.getCurrentPlayer();
    const isCPU = currentPlayerInEffect.isCPU();

    console.log('[CPU Auto-Execute] useEffect fired', {
      version,
      currentPlayerIndex,
      currentPlayerId: currentPlayerInEffect.id,
      isCPU,
      isGameOver: game.isGameOver(),
      isCPUExecuting
    });

    // ゲームオーバー時、CPUでない場合、または既に実行中の場合はスキップ
    if (game.isGameOver() || !isCPU || isCPUExecuting) {
      console.log('[CPU Auto-Execute] Skipped', { isGameOver: game.isGameOver(), isCPU, isCPUExecuting });
      return;
    }

    // CPUターンの計画を立てる
    const timer = setTimeout(() => {
      try {
        const cpuDifficulty = game.players.find(p => p.isCPU())?.id === 'player1'
          ? (game as any).cpuDifficulty || 'Easy'
          : (game as any).cpuDifficulty || 'Easy';

        const strategy = CPUStrategyFactory.createStrategy(cpuDifficulty);
        const plan = strategy.planTurn(game);

        console.log('[CPU Auto-Execute] CPU plan created', { steps: plan.steps.length });

        cpuPlanRef.current = plan;
        setIsCPUExecuting(true);
        setCpuStepsQueue(plan.steps);
      } catch (error) {
        console.error('CPU turn planning failed:', error);
        showError('CPUのターン計画に失敗しました');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [currentPlayerIndex, version, game, isCPUExecuting, showError]);


  const handleCardSelect = (card: Card) => {
    if (!hasGameStarted) return;

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
            const pos = Position.of(row, col);
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
    const card = game.board.getCard(position);
    if (!card) {
      showError('そのマスにはカードがありません');
      return;
    }

    const cardColor = card.color === CardColor.RED ? '赤' : '青';
    const cardValue = card.value.value;

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
      const cardValue = selectedCard.value.value;

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
    // カードを配置していない場合はターン終了できない
    if (placementHistory.length === 0) {
      showError('カードを1枚配置してからターンを終了してください');
      return;
    }

    endTurn();
    clearPlacementHistory();
    selectCard(null);
  };

  const handleResetGame = () => {
    setShowDifficultyModal(true);
  };

  const handleStartGameWithDifficulty = (difficulty: CPUDifficulty) => {
    setShowDifficultyModal(false);
    setShowGameOverModal(false);
    resetGame(difficulty, playerGoesFirst);
    clearMessages();
    addMessage(CommentaryBuilder.gameStart());
    const turnMessage = playerGoesFirst ? '下側のターンです' : '上側のターンです';
    updateCurrent(turnMessage);
    selectCard(null);
    clearHighlight();
    clearBoardCardSelection();
    clearPlacementHistory();

    // CPU実行状態をクリア
    setIsCPUExecuting(false);
    setCpuStepsQueue([]);
    cpuPlanRef.current = null;
  };

  const handleCancelDifficultySelection = () => {
    setShowDifficultyModal(false);
    setSelectedDifficulty('Easy');
    setPlayerGoesFirst(true);
  };

  const handleCancelCard = (position: Position) => {
    // 配置履歴からこのpositionのカードを探す
    const placement = placementHistory.find(ph => ph.position.equals(position));

    if (!placement) {
      showError('取り消すカード配置がありません');
      return;
    }

    try {
      cancelPlacement(position);
      removeLastPlacement();

      const cardColor = placement.card.color === CardColor.RED ? '赤' : '青';
      const cardValue = placement.card.value.value;
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
        const pos = Position.of(row, col);
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
      {showDifficultyModal && (
        <div className="difficulty-modal">
          <div className="difficulty-modal-content">
            <button
              className="modal-close-button"
              onClick={handleCancelDifficultySelection}
              aria-label="閉じる"
            >
              ×
            </button>
            <h2>ゲーム設定</h2>

            <div className="setting-section">
              <h3>CPU難易度</h3>
              <div className="difficulty-buttons">
                {(['Easy', 'Normal', 'Hard'] as CPUDifficulty[]).map((difficulty) => {
                  const isEnabled = CPU_DIFFICULTY_ENABLED[difficulty];
                  const isSelected = selectedDifficulty === difficulty;

                  return (
                    <button
                      key={difficulty}
                      className={`difficulty-button ${isSelected ? 'selected' : ''} ${!isEnabled ? 'disabled' : ''}`}
                      onClick={() => isEnabled && setSelectedDifficulty(difficulty)}
                      disabled={!isEnabled}
                    >
                      {CPU_DIFFICULTY_LABELS[difficulty]}
                      {!isEnabled && <span className="coming-soon">（準備中）</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="setting-section">
              <h3>先攻・後攻</h3>
              <div className="turn-order-buttons">
                <button
                  className={`turn-order-button ${playerGoesFirst ? 'selected' : ''}`}
                  onClick={() => setPlayerGoesFirst(true)}
                >
                  先攻（自分が先）
                </button>
                <button
                  className={`turn-order-button ${!playerGoesFirst ? 'selected' : ''}`}
                  onClick={() => setPlayerGoesFirst(false)}
                >
                  後攻（CPUが先）
                </button>
              </div>
            </div>

            <div className="difficulty-modal-actions">
              <button
                className="difficulty-cancel-button"
                onClick={handleCancelDifficultySelection}
              >
                キャンセル
              </button>
              <button
                className="difficulty-start-button"
                onClick={() => handleStartGameWithDifficulty(selectedDifficulty)}
              >
                ゲーム開始
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="game-header">
        <h1 className="game-title">SquFibo（すくふぃぼ）</h1>
        <button className="reset-button" onClick={handleResetGame}>
          新しいゲーム
        </button>
      </div>

      <div className="game-content">
        <div className="opponent-area">
          <HandArea
            cards={hasGameStarted ? player2.hand.getCards() : []}
            selectedCard={isPlayer1Turn ? null : selectedCard}
            onCardClick={handleCardSelect}
            label="上側の手札"
            isOpponent={isPlayer1Turn}
            disabled={!hasGameStarted}
            hideCardDetails={true}
          />
        </div>

        <div className="game-middle">
          <div className="status-board-commentary-container">
            <GameStatus game={game} />
            <div className="board-and-info-container">
              <BoardGrid
                board={game.board}
                highlightedPositions={highlightedPositions}
                selectedCards={selectedBoardCards}
                isValidCombo={isValidCombo}
                onCellClick={handleCellClick}
                onCardClick={toggleBoardCardSelection}
                showDeleteIcons={isBoardFull && !isGameOver && placementHistory.length === 0}
                onDeleteCard={handleDeleteBoardCard}
                showCancelIcons={placementHistory.length > 0}
                onCancelCard={handleCancelCard}
                placementHistory={placementHistory}
                disabled={!hasGameStarted}
              />
              <div className="info-display-area">
                {isBoardFull && placementHistory.length === 0 && (
                  <div className="board-full-notice">
                    ⚠️ 盤面が満杯です。盤面のカードのゴミ箱アイコンをクリックして廃棄するか、役を申告してください。
                  </div>
                )}
                {selectedCard && (
                  <div className="selected-card-info">
                    選択中: {selectedCard.color} {selectedCard.value.value}
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
              disabled={!hasGameStarted}
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
            selectedCard={isPlayer1Turn ? selectedCard : null}
            onCardClick={handleCardSelect}
            label="下側の手札"
            isOpponent={!isPlayer1Turn}
            disabled={!hasGameStarted}
          />
          <CommentaryArea messages={messages} />
        </div>
      </div>
    </div>
  );
}
