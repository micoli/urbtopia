import { FORMATIONS, type Formation, type MatchEvent, type MatchState } from '../../core';

// The pitch is 105 by 68, the home side defends the left goal and attacks to the right.
export const PITCH = { width: 105, height: 68 };

export interface Spot {
  x: number;
  y: number;
}

const LINE_X = { goalkeeper: 5, defender: 24, midfielder: 48, forward: 70 };

const spread = (count: number): number[] => Array.from({ length: count }, (_, index) => ((index + 1) * PITCH.height) / (count + 1));

// Where each of the eleven stands at rest, in the order of the lineup: the goalkeeper, then the defenders, midfielders and forwards.
export function formationSpots(formation: Formation): Spot[] {
  const lines = FORMATIONS[formation];
  return [
    { x: LINE_X.goalkeeper, y: PITCH.height / 2 },
    ...(['defender', 'midfielder', 'forward'] as const).flatMap(line => spread(lines[line]).map(y => ({ x: LINE_X[line], y }))),
  ];
}

const mirror = (spot: Spot): Spot => ({ x: PITCH.width - spot.x, y: PITCH.height - spot.y });

const noise = (seed: number, minute: number, salt: number): number => {
  const value = Math.sin(seed * 0.001 + minute * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

const RECENT_MINUTES = 3;

const attackedGoalX = (side: 0 | 1): number => (side === 0 ? PITCH.width - 4 : 4);

// The ball follows the Match: at the goal on a goal, in the box of the attacker after a chance, otherwise wandering about the middle.
export function ballSpot(state: Pick<MatchState, 'minute' | 'events'>, seed: number): Spot {
  const centre = { x: PITCH.width / 2, y: PITCH.height / 2 };
  if (state.minute === 0) return centre;
  const recent = [...state.events].reverse().find((event): event is MatchEvent & { type: 'chance' | 'goal' } => (event.type === 'chance' || event.type === 'goal') && state.minute - event.minute < RECENT_MINUTES);
  if (recent?.type === 'goal' && recent.minute === state.minute) return { x: attackedGoalX(recent.side), y: PITCH.height / 2 };
  if (recent) return { x: attackedGoalX(recent.side) + (recent.side === 0 ? -11 : 11), y: 20 + 28 * noise(seed, recent.minute, 1) };
  return { x: clamp(centre.x + 26 * Math.sin(state.minute * 0.9 + noise(seed, 0, 2) * 6), 8, PITCH.width - 8), y: clamp(centre.y + 20 * Math.sin(state.minute * 1.7 + noise(seed, 0, 3) * 6), 6, PITCH.height - 6) };
}

// How far each player drifts toward the ball, and how far he wanders on his own: the goalkeeper hardly, the forwards most.
const PULL = [0.04, 0.12, 0.12, 0.12, 0.12, 0.2, 0.2, 0.2, 0.2, 0.26, 0.26];
const WANDER = [1.2, 2.5, 2.5, 2.5, 2.5, 4, 4, 4, 4, 5, 5];

// A run: now and then a player breaks away toward the ball or the goal he attacks, far beyond his usual drift.
const RUN_CHANCE = 0.14;
const RUN_LENGTH = 9;

export interface PitchPlayer extends Spot {
  id: number;
  name: string;
  side: 0 | 1;
  number: number;
}

// One player's own movement at a minute: a slow drift of his own, a pull toward the ball that varies from minute to minute, and sometimes a run. All of it comes from the seed, so a replay shows the same Match.
function movement(seed: number, side: 0 | 1, index: number, minute: number, rest: Spot, ball: Spot): Spot {
  const who = side * 11 + index + 1;
  const wander = WANDER[index] ?? 4;
  const slow = (salt: number) => Math.sin(minute * (0.6 + 1.1 * noise(seed, who, salt)) + 6.28 * noise(seed, who, salt + 1)) * wander;
  const pull = (PULL[index] ?? 0.2) * (0.4 + 1.2 * noise(seed, minute + who * 101, 11));
  let x = rest.x + (ball.x - rest.x) * pull + slow(3);
  let y = rest.y + (ball.y - rest.y) * pull + slow(5);
  if (index > 0 && noise(seed, minute + who * 53, 17) < RUN_CHANCE) {
    const goalX = side === 0 ? PITCH.width - 6 : 6;
    const target = noise(seed, minute + who * 29, 19) < 0.5 ? ball : { x: goalX, y: PITCH.height / 2 + (noise(seed, minute + who, 23) - 0.5) * 24 };
    const dx = target.x - x;
    const dy = target.y - y;
    const distance = Math.hypot(dx, dy) || 1;
    x += (dx / distance) * Math.min(RUN_LENGTH, distance);
    y += (dy / distance) * Math.min(RUN_LENGTH, distance);
  }
  return { x, y };
}

export function pitchPlayers(state: MatchState, formation: Formation, seed: number): PitchPlayer[] {
  const ball = ballSpot(state, seed);
  const place = (side: 0 | 1, spots: Spot[]): PitchPlayer[] =>
    state.sides[side].pitch.map((player, index) => {
      const rest = spots[index] ?? spots.at(-1)!;
      const moved = movement(seed, side, index, state.minute, rest, ball);
      return { id: player.id, name: player.name, side, number: index + 1, x: clamp(moved.x, 1.5, PITCH.width - 1.5), y: clamp(moved.y, 1.5, PITCH.height - 1.5) };
    });
  return [...place(0, formationSpots(formation)), ...place(1, formationSpots('4-4-2').map(mirror))];
}
