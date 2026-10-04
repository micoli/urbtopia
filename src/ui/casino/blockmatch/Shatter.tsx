import type { EffectOf } from '../../../core/leisure/blockmatch/types';

const PIECES_BROKEN = 7;
const PIECES_HIT = 3;

export const Shatter = ({ effect }: { effect: EffectOf<'shatter'> }) => {
  const pieces = effect.broken ? PIECES_BROKEN : PIECES_HIT;
  return (
    <div
      className={`fx fx-shatter fx-shatter--${effect.material} ${effect.broken ? '' : 'fx-shatter--hit'}`}
      style={{ '--r': effect.r, '--c': effect.c }}
    >
      <span className="fx-shatter__dust" />
      {Array.from({ length: pieces }, (_, i) => (
        <span
          key={i}
          className="fx-shatter__piece"
          style={{
            '--a': `${-160 + (140 / pieces) * i + ((effect.id * 13) % 20)}deg`,
            '--d': 0.5 + ((i * 5 + effect.id) % 4) * 0.15,
            '--spin': `${i % 2 ? 1 : -1}`,
          }}
        />
      ))}
    </div>
  );
};
