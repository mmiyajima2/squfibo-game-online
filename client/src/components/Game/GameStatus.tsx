import { Game } from '../../domain/Game';
import './GameStatus.css';

interface GameStatusProps {
  game: Game;
  isOnlineMode?: boolean;
  role?: 'host' | 'guest' | null;
  playerName?: string | null;
  opponentPlayerName?: string | null;
}

export function GameStatus({
  game,
  isOnlineMode = false,
  role = null,
  playerName = null,
  opponentPlayerName = null
}: GameStatusProps) {
  const currentPlayer = game.getCurrentPlayer();
  const opponent = game.getOpponent();
  const isGameOver = game.isGameOver();
  const winner = game.getWinner();

  // プレイヤー名を決定
  // オンラインモードの場合: player1（下側）とplayer2（上側）の名前を決定
  // オフラインモードの場合: デフォルト名を使用
  const getPlayer1Name = () => {
    if (isOnlineMode) {
      if (role === 'host') {
        return playerName || 'ホスト';
      } else if (role === 'guest') {
        return opponentPlayerName || 'ホスト';
      }
    }
    return '下側';
  };

  const getPlayer2Name = () => {
    if (isOnlineMode) {
      if (role === 'host') {
        return opponentPlayerName || 'ゲスト';
      } else if (role === 'guest') {
        return playerName || 'ゲスト';
      }
    }
    return '上側';
  };

  const player1Name = getPlayer1Name();
  const player2Name = getPlayer2Name();

  // 現在のターンのプレイヤー名を取得
  // オンラインモードではインデックスで、オフラインモードではIDで判定
  const getCurrentPlayerName = () => {
    if (isOnlineMode) {
      return game.currentPlayerIndex === 0 ? player1Name : player2Name;
    }
    return currentPlayer.id === 'player1' ? player1Name : player2Name;
  };

  return (
    <div className="game-status">
      <div className="status-section">
        <div className="status-item">
          <span className="status-label">現在のターン:</span>
          <span className="status-value current-turn">
            {getCurrentPlayerName()}
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
          <span className="player-name">{player2Name}</span>
          <span className="player-stars">⭐ {currentPlayer.id === 'player2' ? currentPlayer.stars : opponent.stars}</span>
        </div>
        <div className="player-score">
          <span className="player-name">{player1Name}</span>
          <span className="player-stars">⭐ {currentPlayer.id === 'player1' ? currentPlayer.stars : opponent.stars}</span>
        </div>
      </div>

      {isGameOver && (
        <div className="game-over">
          <div className="game-over-title">ゲーム終了</div>
          <div className="game-over-result">
            {winner ? (
              <span>
                {(() => {
                  // オンラインモードではplayers配列のインデックスで、オフラインモードではIDで判定
                  if (isOnlineMode) {
                    const winnerIndex = game.players[0].id === winner.id ? 0 : 1;
                    return winnerIndex === 0 ? player1Name : player2Name;
                  }
                  return winner.id === 'player1' ? player1Name : player2Name;
                })()}の勝利！
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
