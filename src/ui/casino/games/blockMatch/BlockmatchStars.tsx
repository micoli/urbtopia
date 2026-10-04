import { MAX_BLOCKMATCH_STARS } from '../../../core';

interface BlockmatchStarsProps {
  count: number;
}

export function BlockmatchStars({ count }: BlockmatchStarsProps) {
  return (
    <span className="stars stars--lg" aria-label={`${count} / ${MAX_BLOCKMATCH_STARS}`}>
      {Array.from({ length: MAX_BLOCKMATCH_STARS }, (_, index) => (
        <span key={index} className={index < count ? 'star star--on' : 'star'}>★</span>
      ))}
    </span>
  );
}
