import { handValue, type Card } from '../../core';
import { CardSlot } from './CardSlot';

const MIN_SLOTS = 5;
const DEAL_STEP_MS = 160;

interface CardHandProps {
  label: string;
  cards: readonly Card[];
  hideSecond?: boolean;
  firstDelay?: number;
}

export function CardHand({ label, cards, hideSecond = false, firstDelay = 0 }: CardHandProps) {
  const slots = Math.max(MIN_SLOTS, cards.length);
  return (
    <div className="card-hand">
      <p className="stat-tight"><strong>{label}</strong>{cards.length === 0 || hideSecond ? '' : ` · ${handValue(cards).total}`}</p>
      <div className="card-row">
        {Array.from({ length: slots }, (_, index) => (
          <CardSlot key={index} card={cards[index] ?? null} faceDown={hideSecond && index === 1} delay={index < 2 ? firstDelay + index * 2 * DEAL_STEP_MS : 0} />
        ))}
      </div>
    </div>
  );
}
