import type { BaseballEvent, BaseballState } from '../../core';

// The field is drawn in a 100 by 100 square, home plate at the bottom.
export const FIELD = 100;

export interface Spot {
  x: number;
  y: number;
}

export const HOME: Spot = { x: 50, y: 86 };
export const BASES: readonly Spot[] = [{ x: 72, y: 64 }, { x: 50, y: 42 }, { x: 28, y: 64 }];
export const MOUND: Spot = { x: 50, y: 64 };

// Where the fielders stand: the catcher behind the plate, four infielders, three outfielders; the ninth hitter is the extra bat and stays off the field.
const INFIELD: readonly Spot[] = [{ x: 64, y: 62 }, { x: 58, y: 50 }, { x: 42, y: 50 }, { x: 36, y: 62 }];
const OUTFIELD: readonly Spot[] = [{ x: 20, y: 28 }, { x: 50, y: 16 }, { x: 80, y: 28 }];
const CATCHER: Spot = { x: 50, y: 94 };

export type Play = Extract<BaseballEvent, { outs: number }>;

export const isPlay = (event: BaseballEvent): event is Play => event.type !== 'change' && event.type !== 'approach';

// An inning is simulated whole, then played out one play at a time: what the player may know once a number of plays have been shown. The last at-bat of a tie has no play, so the final score comes from the state.
export function replayUpTo(state: Pick<BaseballState, 'events' | 'score' | 'inning'>, shown: number): Pick<BaseballState, 'events' | 'score' | 'inning'> {
  const plays = state.events.filter(isPlay);
  if (shown >= plays.length) return state;
  let seen = 0;
  const score: [number, number] = [0, 0];
  for (const play of plays.slice(0, shown)) score[play.side] += play.runs;
  return { events: state.events.filter(event => !isPlay(event) || ++seen <= shown), score, inning: plays[Math.max(0, shown - 1)]!.inning };
}

const noise = (seed: number, index: number, salt: number): number => {
  const value = Math.sin(seed * 0.001 + index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

// Where the ball ends up after a play: a strikeout in the catcher's glove, an out to a fielder, a hit in front of or between the outfielders, a home run over the fence. The place changes from play to play.
export function ballSpot(play: Play | undefined, seed: number, index: number): Spot {
  if (!play) return MOUND;
  const along = noise(seed, index, 1);
  const across = noise(seed, index, 2);
  switch (play.type) {
    case 'strikeout':
      return CATCHER;
    case 'walk':
      return { x: 50 + (across - 0.5) * 6, y: 74 };
    case 'out':
      return { x: 25 + 50 * across, y: 38 + 24 * along };
    case 'single':
      return { x: 18 + 64 * across, y: 36 + 14 * along };
    case 'double':
      return { x: 14 + 72 * across, y: 20 + 12 * along };
    case 'homer':
      return { x: 20 + 60 * across, y: 4 + 6 * along };
  }
}

export interface FieldPlayer extends Spot {
  id: number;
  name: string;
  role: 'pitcher' | 'catcher' | 'infield' | 'outfield';
  number: number;
}

// The nine in the field for a defence: the pitcher, the catcher, then the infielders and outfielders in the order of the batting order, filled in from whoever is left when a position is short.
export function fieldersOf(defence: Pick<BaseballState['sides'][number], 'pitcher' | 'lineup'>, ball: Spot, seed: number, index: number): FieldPlayer[] {
  const hitters = [...defence.lineup];
  const take = (position: string): (typeof hitters)[number] | undefined => {
    const found = hitters.findIndex(hitter => hitter.position === position);
    return found >= 0 ? hitters.splice(found, 1)[0] : hitters.shift();
  };
  const catcher = take('catcher');
  const infield = INFIELD.map(() => take('infielder'));
  const outfield = OUTFIELD.map(() => take('outfielder'));
  const spots: { who: ReturnType<typeof take>; spot: Spot; role: FieldPlayer['role']; pull: number }[] = [
    { who: defence.pitcher, spot: MOUND, role: 'pitcher', pull: 0.05 },
    { who: catcher, spot: CATCHER, role: 'catcher', pull: 0.02 },
    ...infield.map((who, slot) => ({ who, spot: INFIELD[slot]!, role: 'infield' as const, pull: 0.3 })),
    ...outfield.map((who, slot) => ({ who, spot: OUTFIELD[slot]!, role: 'outfield' as const, pull: 0.35 })),
  ];
  return spots.flatMap(({ who, spot, role, pull }, number) => {
    if (!who) return [];
    const jitter = (salt: number) => (noise(seed, index * 17 + number, salt) - 0.5) * 5;
    const reach = pull * (0.4 + 1.2 * noise(seed, index * 17 + number, 9));
    return [{ id: who.id, name: who.name, role, number: number + 1, x: clamp(spot.x + (ball.x - spot.x) * reach + jitter(3), 2, FIELD - 2), y: clamp(spot.y + (ball.y - spot.y) * reach + jitter(5), 2, FIELD - 2) }];
  });
}

// The runners on the bases after a play, and the batter at the plate for the next one.
export function runnerSpots(bases: readonly boolean[]): Spot[] {
  return BASES.filter((_, base) => bases[base]);
}
