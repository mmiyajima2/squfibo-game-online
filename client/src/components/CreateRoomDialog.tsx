import { useState, useEffect } from 'react';
import { createRoom } from '../lib/socket';
import type { RoomCreatedPayload, ErrorPayload } from '../lib/socket';
import './CreateRoomDialog.css';

interface CreateRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: RoomCreatedPayload, playerName: string) => void;
}

export function CreateRoomDialog({ isOpen, onClose, onSuccess }: CreateRoomDialogProps) {
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

    // 部屋を作成
    const trimmedPlayerName = playerName.trim();
    createRoom(
      trimmedPlayerName,
      (data: RoomCreatedPayload) => {
        setIsLoading(false);
        onSuccess(data, trimmedPlayerName);
      },
      (error: ErrorPayload) => {
        setIsLoading(false);
        setError(error.message || 'エラーが発生しました');
      }
    );
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
      </div>
    </div>
  );
}
