import type { ComponentType } from 'react';
import type { Effect, EffectOf } from '../../../../core/leisure/blockmatch/types.ts';
import { Beam } from './Beam.tsx';
import { Burst } from './Burst.tsx';
import { Lightning } from './Lightning.tsx';
import { Shatter } from './Shatter.tsx';
import { Shockwave } from './Shockwave.tsx';

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
