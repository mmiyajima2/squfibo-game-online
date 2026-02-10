import { useState, useEffect } from 'react';
import { createRoom } from '../lib/socket';
import type { RoomCreatedPayload, ErrorPayload } from '../lib/socket';
import './CreateRoomDialog.css';

interface CreateRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomDialog({ isOpen, onClose }: CreateRoomDialogProps) {
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomCreatedPayload | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<'host' | 'guest' | null>(null);

  // ダイアログが開くたびにリセット
  useEffect(() => {
    if (isOpen) {
      setPlayerName('');
      setIsLoading(false);
      setError(null);
      setRoomData(null);
      setCopiedUrl(null);
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
      },
      (error: ErrorPayload) => {
        setIsLoading(false);
        setError(error.message || 'エラーが発生しました');
      }
    );
  };

  const handleCopyUrl = async (url: string, type: 'host' | 'guest') => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(type);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      setError('URLのコピーに失敗しました');
    }
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
                対戦部屋が作成されました。下のURLを友達に送って招待しましょう！
              </p>

              <div className="url-section">
                <h3 className="url-title">ホスト用URL（あなた）</h3>
                <div className="url-container">
                  <input
                    type="text"
                    className="url-input"
                    value={roomData.hostUrl}
                    readOnly
                  />
                  <button
                    className="btn btn-copy"
                    onClick={() => handleCopyUrl(roomData.hostUrl, 'host')}
                  >
                    {copiedUrl === 'host' ? 'コピー完了！' : 'コピー'}
                  </button>
                </div>
              </div>

              <div className="url-section">
                <h3 className="url-title">ゲスト用URL（友達に送る）</h3>
                <div className="url-container">
                  <input
                    type="text"
                    className="url-input"
                    value={roomData.guestUrl}
                    readOnly
                  />
                  <button
                    className="btn btn-copy"
                    onClick={() => handleCopyUrl(roomData.guestUrl, 'guest')}
                  >
                    {copiedUrl === 'guest' ? 'コピー完了！' : 'コピー'}
                  </button>
                </div>
              </div>

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

              <button className="btn btn-primary" onClick={handleClose}>
                閉じる
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
