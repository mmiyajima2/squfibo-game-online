import { Board } from '../../domain/entities/Board';
import type { Position } from 'squfibo-shared';
import { positionEquals } from 'squfibo-shared';
import { Card } from '../../domain/entities/Card';
import { Cell } from './Cell';
import './BoardGrid.css';

interface PlacedCardHistory {
  card: Card;
  position: Position;
}

interface BoardGridProps {
  board: Board;
  highlightedPositions?: Position[];
  selectedCards?: Card[];
  isValidCombo?: boolean;
  onCellClick?: (position: Position) => void;
  onCardClick?: (card: Card) => void;
  showDeleteIcons?: boolean;
  onDeleteCard?: (position: Position) => void;
  showCancelIcons?: boolean;
  onCancelCard?: (position: Position) => void;
  placementHistory?: PlacedCardHistory[];
  disabled?: boolean;
}

export function BoardGrid({
  board,
  highlightedPositions = [],
  selectedCards = [],
  isValidCombo = false,
  onCellClick,
  onCardClick,
  showDeleteIcons = false,
  onDeleteCard,
  showCancelIcons = false,
  onCancelCard,
  placementHistory = [],
  disabled = false,
}: BoardGridProps) {
  const isHighlighted = (position: Position): boolean => {
    return highlightedPositions.some((p) => positionEquals(p, position));
  };

  const isSelected = (card: Card | null): boolean => {
    if (!card) return false;
    return selectedCards.some((c) => c.id === card.id);
  };

  const isJustPlaced = (position: Position, card: Card | null): boolean => {
    if (!card) return false;
    return placementHistory.some(
      (ph) => positionEquals(ph.position, position) && ph.card.id === card.id
    );
  };

  const handleCellClick = (position: Position) => {
    if (onCellClick && !disabled) {
      onCellClick(position);
    }
  };

  return (
    <div className={`board-grid ${disabled ? 'board-grid-disabled' : ''}`}>
      {[0, 1, 2].map((row) => (
        <div key={row} className="board-row">
          {[0, 1, 2].map((col) => {
            const position = { row: row, col: col };
            const card = board.getCard(position);
            return (
              <Cell
                key={`${row}-${col}`}
                position={position}
                card={card}
                isHighlighted={isHighlighted(position)}
                isSelected={isSelected(card)}
                isInCombo={isSelected(card) && isValidCombo}
                onClick={() => handleCellClick(position)}
                onCardClick={onCardClick}
                showDeleteIcon={showDeleteIcons && card !== null}
                onDeleteCard={onDeleteCard}
                showCancelIcon={showCancelIcons && isJustPlaced(position, card)}
                onCancelCard={onCancelCard}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
