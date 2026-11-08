import type { BasketballEvent, BasketballState } from '../../core';
import { clamp, noise } from './seededNoise';

// The court is 94 by 50 feet, the home side defends the left hoop and attacks to the right.
export const COURT = { width: 94, height: 50 };
export const HOOP_X = 5.25;

export interface Spot {
  x: number;
  y: number;
}

// Where each position stands in its own half, in the order the players of a position come.
const SLOTS: Readonly<Record<string, readonly Spot[]>> = {
  guard: [{ x: 34, y: 14 }, { x: 34, y: 36 }, { x: 30, y: 25 }],
  wing: [{ x: 22, y: 9 }, { x: 22, y: 41 }, { x: 26, y: 25 }],
  center: [{ x: 12, y: 25 }, { x: 17, y: 25 }],
};

// How far a side pushes up the court when it has the ball, and how far each player drifts toward the ball or on his own.
const ADVANCE = 34;
const PULL = 0.22;
const WANDER = 3.5;
const CUT_CHANCE = 0.25;
const CUT_LENGTH = 9;

const goalOf = (side: 0 | 1): Spot => ({ x: side === 0 ? COURT.width - HOOP_X : HOOP_X, y: COURT.height / 2 });

export const isScoreEvent = (event: BasketballEvent): event is Extract<BasketballEvent, { points: number }> => event.type === 'two' || event.type === 'three' || event.type === 'freeThrows';

const scoreOf = (state: Pick<BasketballState, 'minute' | 'events'>) => state.events.filter(event => event.minute === state.minute).filter(isScoreEvent).at(-1);

// The side with the ball this minute: the one that scored, otherwise a draw that swaps from minute to minute.
export function attackingSide(state: Pick<BasketballState, 'minute' | 'events'>, seed: number): 0 | 1 {
  const score = scoreOf(state);
  if (score) return score.side;
  return noise(seed, state.minute, 31) < 0.5 ? 0 : 1;
}

export interface CourtPlayer extends Spot {
  id: number;
  name: string;
  side: 0 | 1;
  slot: number;
  number: number;
}

const rest = (side: 0 | 1, position: string, count: number): Spot => {
  const slots = SLOTS[position] ?? SLOTS.guard!;
  const slot = slots[count % slots.length]!;
  return side === 0 ? slot : { x: COURT.width - slot.x, y: COURT.height - slot.y };
};

// A player at a minute: his place, pushed up the court when his side attacks, a slow drift of his own, a pull toward the ball and now and then a cut to the hoop. All of it comes from the seed, so a replay shows the same Match.
function movement(seed: number, side: 0 | 1, index: number, minute: number, home: Spot, attacking: boolean, ball: Spot): Spot {
  const who = side * 5 + index + 1;
  const direction = side === 0 ? 1 : -1;
  const slow = (salt: number) => Math.sin(minute * (0.7 + 1.2 * noise(seed, who, salt)) + 6.28 * noise(seed, who, salt + 1)) * WANDER;
  let x = home.x + (attacking ? direction * ADVANCE * (0.7 + 0.3 * noise(seed, who, 7)) : 0) + slow(3);
  let y = home.y + slow(5);
  x += (ball.x - x) * PULL;
  y += (ball.y - y) * PULL;
  if (attacking && noise(seed, minute + who * 53, 17) < CUT_CHANCE) {
    const hoop = goalOf(side);
    const dx = hoop.x - x;
    const dy = hoop.y - y;
    const distance = Math.hypot(dx, dy) || 1;
    x += (dx / distance) * Math.min(CUT_LENGTH, distance);
    y += (dy / distance) * Math.min(CUT_LENGTH, distance);
  }
  return { x, y };
}

// The ball is at the hoop on a basket, otherwise with the point of the side that attacks.
export function ballSpot(state: Pick<BasketballState, 'minute' | 'events'>, seed: number): Spot {
  const centre = { x: COURT.width / 2, y: COURT.height / 2 };
  if (state.minute === 0) return centre;
  const score = scoreOf(state);
  if (score) return goalOf(score.side);
  const side = attackingSide(state, seed);
  const direction = side === 0 ? 1 : -1;
  return { x: clamp(centre.x + direction * (10 + 22 * noise(seed, state.minute, 41)), 6, COURT.width - 6), y: clamp(centre.y + (noise(seed, state.minute, 43) - 0.5) * 24, 6, COURT.height - 6) };
}

export function courtPlayers(state: BasketballState, seed: number, jerseys?: ReadonlyMap<number, number>): CourtPlayer[] {
  const attacker = attackingSide(state, seed);
  const ball = ballSpot(state, seed);
  return state.sides.flatMap((side, sideIndex) => {
    const index = sideIndex as 0 | 1;
    const used = new Map<string, number>();
    return side.court.map((player, slot) => {
      const count = used.get(player.position) ?? 0;
      used.set(player.position, count + 1);
      const moved = state.minute === 0 ? rest(index, player.position, count) : movement(seed, index, slot, state.minute, rest(index, player.position, count), attacker === index, ball);
      return { id: player.id, name: player.name, side: index, slot, number: (index === 0 && jerseys?.get(player.id)) || slot + 4, x: clamp(moved.x, 2, COURT.width - 2), y: clamp(moved.y, 2.5, COURT.height - 2.5) };
    });
  });
}
