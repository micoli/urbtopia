import type { Card } from '../../core';

const SUIT_GLYPHS: Record<Card['suit'], string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };

interface PlayingCardProps {
  card: Card | null;
}

export function PlayingCard({ card }: PlayingCardProps) {
  if (!card) return <span className="playing-card" data-hidden="true" aria-hidden="true" />;
  const red = card.suit === 'hearts' || card.suit === 'diamonds';
  return (
    <span className="playing-card" data-red={red}>
      {card.rank}{SUIT_GLYPHS[card.suit]}
    </span>
  );
}
