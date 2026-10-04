import type { EffectOf, Pos } from '../../../../core/leisure/blockmatch/types.ts';

const JAG = 0.35;

const boltPoints = (origin: Pos, target: Pos, index: number) => {
  const x1 = origin.c + 0.5;
  const y1 = origin.r + 0.5;
  const x2 = target.c + 0.5;
  const y2 = target.r + 0.5;
  const length = Math.hypot(x2 - x1, y2 - y1) || 1;
  const side = index % 2 ? 1 : -1;
  const nx = (-(y2 - y1) / length) * JAG * side;
  const ny = ((x2 - x1) / length) * JAG * side;
  const at = (t: number, sign: number) => `${x1 + (x2 - x1) * t + nx * sign},${y1 + (y2 - y1) * t + ny * sign}`;
  return `${x1},${y1} ${at(0.33, 1)} ${at(0.66, -1)} ${x2},${y2}`;
};

type Props = { effect: EffectOf<'lightning'>; rows: number; cols: number };

export const Lightning = ({ effect, rows, cols }: Props) => (
  <svg className="fx-lightning" viewBox={`0 0 ${cols} ${rows}`}>
    {effect.targets.map((target, index) => (
      <polyline key={index} className="fx-lightning__bolt" points={boltPoints(effect, target, index)} pathLength="1" />
    ))}
    <circle className="fx-lightning__orb" cx={effect.c + 0.5} cy={effect.r + 0.5} r="0.6" />
  </svg>
);
