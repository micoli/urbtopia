import type { ActivationType, Board, Effect, Plan } from './types';

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

let nextEffectId = 1;

const BEAMS: Partial<Record<ActivationType, { dir: 'h' | 'v'; offset: number }[]>> = {
  rocketH: [{ dir: 'h', offset: 0 }],
  rocketV: [{ dir: 'v', offset: 0 }],
  cross: [
    { dir: 'h', offset: 0 },
    { dir: 'v', offset: 0 },
  ],
  bigCross: [-1, 0, 1].flatMap((offset) => [
    { dir: 'h', offset },
    { dir: 'v', offset },
  ]),
};

const SHOCK_RADIUS: Partial<Record<ActivationType, number>> = { bomb: 2.5, bigBomb: 3.5 };

const LIGHTNING_TYPES: ActivationType[] = ['color', 'lightball'];


// Must run before the plan is applied: it reads the tiles about to be destroyed.
export const buildEffects = (board: Board, plan: Plan) => {
  const effects: Effect[] = [];
  const add = (effect: DistributiveOmit<Effect, 'id'>) => effects.push({ id: nextEffectId++, ...effect } as Effect);

  plan.cleared.forEach(({ r, c }) => {
    const tile = board.tiles[r]![c];
    if (tile) add({ kind: 'burst', r, c, color: tile.special || tile.color === null ? 'special' : tile.color });
    if (board.ice[r]![c]! > 0) add({ kind: 'shatter', r, c, material: 'ice', broken: true });
  });

  plan.boxHits.forEach(({ r, c }) => {
    add({ kind: 'shatter', r, c, material: 'wood', broken: board.boxes[r]![c] === 1 });
  });

  plan.blasts.forEach(({ r, c, type, cells }) => {
    (BEAMS[type] ?? []).forEach(({ dir, offset }) => {
      add({ kind: 'beam', dir, r: dir === 'h' ? r + offset : r, c: dir === 'v' ? c + offset : c, originR: r, originC: c });
    });
    const radius = SHOCK_RADIUS[type];
    if (radius) add({ kind: 'shockwave', r, c, radius });
    if (type === 'all') add({ kind: 'shockwave', r, c, radius: Math.max(board.rows, board.cols) });
    if (LIGHTNING_TYPES.includes(type)) add({ kind: 'lightning', r, c, targets: cells });
  });

  return effects;
};
