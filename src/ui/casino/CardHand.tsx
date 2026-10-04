import { handValue, type Card } from '../../core';
import { PlayingCard } from './PlayingCard';

interface CardHandProps {
  label: string;
  cards: readonly Card[];
  hideSecond?: boolean;
}

export function CardHand({ label, cards, hideSecond = false }: CardHandProps) {
  return (
    <div className="card-hand">
      <p className="stat-tight"><strong>{label}</strong>{hideSecond ? '' : ` · ${handValue(cards).total}`}</p>
      <div className="card-row">
        {cards.map((card, index) => <PlayingCard key={index} card={hideSecond && index === 1 ? null : card} />)}
      </div>
    </div>
  );
}
