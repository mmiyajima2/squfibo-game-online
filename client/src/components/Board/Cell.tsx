import { Card } from '../../domain/entities/Card';
import type { Position } from 'squfibo-shared';
import { CardComponent } from '../Card/CardComponent';
import './Cell.css';

interface CellProps {
  position: Position;
  card: Card | null;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isInCombo?: boolean;
  onClick?: () => void;
  onCardClick?: (card: Card) => void;
  showDeleteIcon?: boolean;
  onDeleteCard?: (position: Position) => void;
  showCancelIcon?: boolean;
  onCancelCard?: (position: Position) => void;
}

export function Cell({
  position,
  card,
  isHighlighted = false,
  isSelected = false,
  isInCombo = false,
  onClick,
  onCardClick,
  showDeleteIcon = false,
  onDeleteCard,
  showCancelIcon = false,
  onCancelCard,
}: CellProps) {
  const handleClick = () => {
    if (card && onCardClick) {
      onCardClick(card);
    } else if (!card && onClick) {
      onClick();
    }
  };

  const handleDeleteCard = (_cardToDelete: Card) => {
    if (onDeleteCard) {
      onDeleteCard(position);
    }
  };

  const handleCancelCard = (_cardToCancel: Card) => {
    if (onCancelCard) {
      onCancelCard(position);
    }
  };

  const classNames = [
    'cell',
    isHighlighted ? 'cell-highlighted' : '',
    isSelected && !isInCombo ? 'cell-selected' : '',
    isInCombo ? 'cell-in-combo' : '',
    (onClick && !card) || (card && onCardClick) ? 'cell-clickable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} onClick={handleClick} data-position={`${position.row}-${position.col}`}>
      {card ? (
        <CardComponent
          card={card}
          size="large"
          isInCombo={isInCombo}
          showDeleteIcon={showDeleteIcon}
          onDelete={handleDeleteCard}
          showCancelIcon={showCancelIcon}
          onCancel={handleCancelCard}
        />
      ) : (
        <div className="cell-empty">
          <div className="cell-empty-indicator" />
        </div>
      )}
    </div>
  );
}
