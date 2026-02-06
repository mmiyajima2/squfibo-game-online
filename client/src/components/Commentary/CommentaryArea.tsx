import type { CommentaryMessage } from '../../types/Commentary';
import './CommentaryArea.css';

interface CommentaryAreaProps {
  messages: CommentaryMessage[];
}

export function CommentaryArea({ messages }: CommentaryAreaProps) {
  // 最新2件のみ表示
  const recentMessages = messages.slice(0, 2);

  return (
    <div className="commentary-area">
      <div className="commentary-messages">
        {recentMessages.length === 0 ? (
          <div className="commentary-empty">まだメッセージがありません</div>
        ) : (
          recentMessages.map((msg, index) => (
            <div
              key={index}
              className={`commentary-message commentary-type-${msg.type} ${index === 0 ? 'commentary-message-latest' : ''}`}
            >
              <span className="commentary-icon">{msg.icon}</span>
              <span className="commentary-text">{msg.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
