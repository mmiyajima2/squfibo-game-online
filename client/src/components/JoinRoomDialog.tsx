import { useState, useEffect } from 'react';
import { joinRoom } from '../lib/socket';
import type { RoomJoinedPayload, ErrorPayload } from '../lib/socket';
import './JoinRoomDialog.css';

interface JoinRoomDialogProps {
  isOpen: boolean;
  roomId: string;
  onClose: () => void;
  onSuccess: (data: RoomJoinedPayload, playerName: string) => void;
}

export function JoinRoomDialog({ isOpen, roomId, onClose, onSuccess }: JoinRoomDialogProps) {
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ダイアログが開くたびにリセット
  useEffect(() => {
    if (isOpen) {
      setPlayerName('');
      setIsLoading(false);
      setError(null);
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

    console.log('[JoinRoomDialog] 部屋参加開始:', { roomId, playerName: playerName.trim() });

    // 部屋に参加
    const trimmedPlayerName = playerName.trim();
    joinRoom(
      roomId,
      trimmedPlayerName,
      (data: RoomJoinedPayload) => {
        console.log('[JoinRoomDialog] 参加成功:', data);
        setIsLoading(false);
        onSuccess(data, trimmedPlayerName);
        console.log('[JoinRoomDialog] onSuccess called');
      },
      (error: ErrorPayload) => {
        console.error('[JoinRoomDialog] 参加失敗:', error);
        setIsLoading(false);
        setError(error.message || 'エラーが発生しました');
      }
    );
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="dialog-overlay" onClick={handleClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        {!isLoading && (
          <button className="dialog-close" onClick={handleClose} aria-label="閉じる">
            ×
          </button>
        )}

        <h2 className="dialog-title">オンライン対戦に参加</h2>
        <p className="dialog-description">
          ホストプレイヤーから招待されたゲームに参加します。
        </p>
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
            {isLoading ? '参加中...' : '部屋に入る'}
          </button>
        </form>
      </div>
    </div>
  );
}
