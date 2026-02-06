import { Game } from '../../domain/Game';
import './GameStatus.css';

interface GameStatusProps {
  game: Game;
}

export function GameStatus({ game }: GameStatusProps) {
  const currentPlayer = game.getCurrentPlayer();
  const opponent = game.getOpponent();
  const isGameOver = game.isGameOver();
  const winner = game.getWinner();

  return (
    <div className="game-status">
      <div className="status-section">
        <div className="status-item">
          <span className="status-label">現在のターン:</span>
          <span className="status-value current-turn">
            {currentPlayer.id === 'player1' ? 'あなた' : 'CPU'}
          </span>
        </div>
      </div>

      <div className="status-section">
        <div className="status-item">
          <span className="status-label">残り星:</span>
          <span className="status-value stars">⭐ {game.getTotalStars()}</span>
        </div>
        <div className="status-item">
          <span className="status-label">山札:</span>
          <span className="status-value deck">{game.deck.getCardCount()} 枚</span>
        </div>
      </div>

      <div className="status-section player-scores">
        <div className="player-score">
          <span className="player-name">CPU</span>
          <span className="player-stars">⭐ {currentPlayer.id === 'player2' ? currentPlayer.stars : opponent.stars}</span>
        </div>
        <div className="player-score">
          <span className="player-name">あなた</span>
          <span className="player-stars">⭐ {currentPlayer.id === 'player1' ? currentPlayer.stars : opponent.stars}</span>
        </div>
      </div>

      {isGameOver && (
        <div className="game-over">
          <div className="game-over-title">ゲーム終了</div>
          <div className="game-over-result">
            {winner ? (
              <span>
                {winner.id === 'player1' ? 'あなた' : 'CPU'}の勝利！
              </span>
            ) : (
              <span>引き分け</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
