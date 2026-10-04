import type { Card } from '../../core';

const SUIT_GLYPHS: Record<Card['suit'], string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };

interface PlayingCardProps {
  card: Card | null;
  delay?: number;
}

export function PlayingCard({ card, delay = 0 }: PlayingCardProps) {
  const dealt = { animationDelay: `${delay}ms` };
  if (!card) return <span className="playing-card" data-hidden="true" aria-hidden="true" style={dealt} />;
  const red = card.suit === 'hearts' || card.suit === 'diamonds';
  return (
    <span className="playing-card" data-red={red} style={dealt}>
      {card.rank}{SUIT_GLYPHS[card.suit]}
    </span>
  );
}
