import type { EffectOf } from '../../../core/leisure/blockmatch/types';

export const Shockwave = ({ effect }: { effect: EffectOf<'shockwave'> }) => (
  <div className="fx fx-shock" style={{ '--r': effect.r, '--c': effect.c, '--radius': effect.radius }}>
    <span className="fx-shock__core" />
    <span className="fx-shock__wave" />
  </div>
);
