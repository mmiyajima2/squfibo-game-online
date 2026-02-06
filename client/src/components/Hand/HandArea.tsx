import { Card } from '../../domain/entities/Card';
import { CardComponent } from '../Card/CardComponent';
import './HandArea.css';

interface HandAreaProps {
  cards: Card[];
  selectedCard: Card | null;
  onCardClick?: (card: Card) => void;
  onDeleteCard?: (card: Card) => void;
  showDeleteIcons?: boolean;
  label?: string;
  isOpponent?: boolean;
  disabled?: boolean;
  hideCardDetails?: boolean;
}

export function HandArea({
  cards,
  selectedCard,
  onCardClick,
  onDeleteCard,
  showDeleteIcons = false,
  label,
  isOpponent = false,
  disabled = false,
  hideCardDetails = false,
}: HandAreaProps) {
  const handleCardClick = (card: Card) => {
    if (onCardClick && !isOpponent && !disabled) {
      onCardClick(card);
    }
  };

  const handleDeleteCard = (card: Card) => {
    if (onDeleteCard) {
      onDeleteCard(card);
    }
  };

  return (
    <div className={`hand-area ${isOpponent ? 'hand-area-opponent' : ''} ${disabled ? 'hand-area-disabled' : ''}`}>
      {label && <div className="hand-area-label">{label}</div>}
      <div className="hand-cards">
        {cards.length === 0 ? (
          <div className="hand-empty">手札なし</div>
        ) : hideCardDetails ? (
          cards.map((_, index) => (
            <div key={`hidden-${index}`} className="hand-card-hidden" />
          ))
        ) : (
          cards.map((card) => (
            <div key={card.id} className="hand-card-wrapper">
              <CardComponent
                card={card}
                size="small"
                isSelected={selectedCard?.equals(card)}
                onClick={() => handleCardClick(card)}
                showDeleteIcon={showDeleteIcons}
                onDelete={handleDeleteCard}
              />
            </div>
          ))
        )}
      </div>
      <div className="hand-count">{cards.length} 枚</div>
    </div>
  );
}
