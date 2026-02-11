import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../lib/socket';
import type { RoomCreatedPayload, ErrorPayload } from '../lib/socket';
import './CreateRoomDialog.css';

interface CreateRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomDialog({ isOpen, onClose }: CreateRoomDialogProps) {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomCreatedPayload | null>(null);

  // ダイアログが開くたびにリセット
  useEffect(() => {
    if (isOpen) {
      setPlayerName('');
      setIsLoading(false);
      setError(null);
      setRoomData(null);
    }
  }, [isOpen]);

  // ダイアログが閉じられる場合は何もしない
  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (playerName.trim().length === 0) {
      setError('プレイヤー名を入力してください');
      return;
    }

    if (playerName.trim().length > 20) {
      setError('プレイヤー名は20文字以内で入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    // 部屋を作成
    createRoom(
      playerName.trim(),
      (data: RoomCreatedPayload) => {
        setIsLoading(false);
        setRoomData(data);

        // ローカルストレージに保存
        localStorage.setItem('squfibo_room_id', data.roomId);
        localStorage.setItem('squfibo_player_id', data.playerId);
        localStorage.setItem('squfibo_player_role', 'host');
        localStorage.setItem('squfibo_guest_url', data.guestUrl);
      },
      (error: ErrorPayload) => {
        setIsLoading(false);
        setError(error.message || 'エラーが発生しました');
      }
    );
  };

  const handleNavigateToGame = () => {
    if (!roomData) return;

    // ホスト用URLから roomId と playerId を抽出してゲーム画面に遷移
    navigate(`/game/${roomData.roomId}/${roomData.playerId}`);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={handleClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={handleClose} aria-label="閉じる">
          ×
        </button>

        {!roomData ? (
          // 部屋作成フォーム
          <>
            <h2 className="dialog-title">オンライン対戦部屋を作成</h2>
            <form onSubmit={handleSubmit} className="dialog-form">
              <div className="form-group">
                <label htmlFor="playerName" className="form-label">
                  あなたのプレイヤー名
                </label>
                <input
                  id="playerName"
                  type="text"
                  className="form-input"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="プレイヤー名を入力（1〜20文字）"
                  maxLength={20}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? '作成中...' : '部屋を作成'}
              </button>
            </form>
          </>
        ) : (
          // 部屋作成成功 - URL表示
          <>
            <h2 className="dialog-title">部屋を作成しました！</h2>
            <div className="room-info">
              <p className="room-success-message">
                対戦部屋が作成されました。下のボタンからゲーム画面に移動してください。
              </p>

              <div className="room-info-details">
                <p>部屋ID: {roomData.roomId}</p>
                <p>
                  有効期限:{' '}
                  {new Date(roomData.expiresAt).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <button className="btn btn-primary" onClick={handleNavigateToGame}>
                ゲーム画面へ移動
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
