import type { ComponentType } from 'react';
import type { Effect, EffectOf } from '../../../core/leisure/blockmatch/types';
import { Beam } from './Beam';
import { Burst } from './Burst';
import { Lightning } from './Lightning';
import { Shatter } from './Shatter';
import { Shockwave } from './Shockwave';

type Props = { effects: Effect[]; rows: number; cols: number };

const COMPONENTS: { [K in Effect['kind']]: ComponentType<{ effect: EffectOf<K>; rows: number; cols: number }> } = {
  burst: Burst,
  shatter: Shatter,
  beam: Beam,
  shockwave: Shockwave,
  lightning: Lightning,
};

export const EffectsLayer = ({ effects, rows, cols }: Props) => (
  <div className="fx-layer">
    {effects.map((effect) => {
      const Component = COMPONENTS[effect.kind] as ComponentType<{ effect: Effect; rows: number; cols: number }>;
      return <Component key={effect.id} effect={effect} rows={rows} cols={cols} />;
    })}
  </div>
);
