import type { ReactNode } from 'react';
import { handValue, type Card } from '../../core';
import { CardSlot } from './CardSlot';
import { Note } from '../common/Note';

const MIN_SLOTS = 5;
const DEAL_STEP_MS = 160;

interface CardHandProps {
  label: string;
  cards: readonly Card[];
  hideSecond?: boolean;
  firstDelay?: number;
  badge?: ReactNode;
}

export function CardHand({ label, cards, hideSecond = false, firstDelay = 0, badge = null }: CardHandProps) {
  const slots = Math.max(MIN_SLOTS, cards.length);
  return (
    <div className="card-hand">
      <Note><strong>{label}</strong>{cards.length === 0 || hideSecond ? '' : ` · ${handValue(cards).total}`}</Note>
      <div className="card-hand-body">
        <div className="card-row" style={{ gridTemplateColumns: `repeat(${slots}, var(--card-w))` }}>
          {Array.from({ length: slots }, (_, index) => (
            <CardSlot key={index} card={cards[index] ?? null} faceDown={hideSecond && index === 1} delay={index < 2 ? firstDelay + index * 2 * DEAL_STEP_MS : 0} />
          ))}
        </div>
        {badge}
      </div>
    </div>
  );
}
