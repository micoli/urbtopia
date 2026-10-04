import type { Card } from '../../core';
import { PlayingCard } from './PlayingCard';

interface CardSlotProps {
  card: Card | null;
  faceDown?: boolean;
  delay?: number;
}

export function CardSlot({ card, faceDown = false, delay = 0 }: CardSlotProps) {
  return (
    <span className="card-slot" data-empty={card === null}>
      {card ? <PlayingCard key={`${card.rank}${card.suit}`} card={faceDown ? null : card} delay={delay} /> : null}
    </span>
  );
}
