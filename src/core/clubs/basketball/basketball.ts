import { nextRandom } from '../../engine/random';
import type { ClubData, Lineup, MatchDecision, MatchReport, Opponent, Player, SportRules } from '../clubTypes';

export const BASKETBALL_POSITIONS = ['guard', 'wing', 'center'] as const;

export const BASKETBALL_FORMATIONS = {
  '2-2-1': { guard: 2, wing: 2, center: 1 },
  '3-1-1': { guard: 3, wing: 1, center: 1 },
  '1-2-2': { guard: 1, wing: 2, center: 2 },
} as const;

export type BasketballFormation = keyof typeof BASKETBALL_FORMATIONS;

export const BASKETBALL_FORMATION_IDS = Object.keys(BASKETBALL_FORMATIONS) as BasketballFormation[];

export const BASKETBALL_TACTICS = ['defensive', 'balanced', 'fastBreak', 'threePoint'] as const;
export type BasketballTactic = (typeof BASKETBALL_TACTICS)[number];

export const BASKETBALL = {
  starters: 5,
  maxSubstitutions: 10,
  minutes: 48,
  overtimeMinutes: 5,
  maxOvertimes: 3,
  possessionsPerMinute: 2,
  turnover: 0.13,
  freeThrow: 0.1,
  freeThrowMake: 0.75,
  twoBase: 0.5,
  threeBase: 0.36,
  makeMin: 0.2,
  makeMax: 0.75,
  // How fast the shooting percentage follows the gap between attack and defence.
  ratioPower: 0.4,
  defaultFormation: '2-2-1' as BasketballFormation,
  defaultTactic: 'balanced' as BasketballTactic,
  // Possessions, share of three-point attempts, attack and defence by tactic.
  tactics: {
    defensive: { pace: 0.9, threes: 0.28, attack: 0.94, defence: 1.1 },
    balanced: { pace: 1, threes: 0.34, attack: 1, defence: 1 },
    fastBreak: { pace: 1.2, threes: 0.3, attack: 1.1, defence: 0.93 },
    threePoint: { pace: 1, threes: 0.5, attack: 1, defence: 0.98 },
  } as Record<BasketballTactic, { pace: number; threes: number; attack: number; defence: number }>,
};

export const BASKETBALL_RULES: SportRules = {
  sport: 'basketball',
  squadMin: 8,
  squadMax: 15,
  composition: { guard: 5, wing: 5, center: 3 },
  ratingRange: [35, 90],
  draws: false,
  lineupIssue: (club, lineup) => lineupIssue(club.squad, lineup.formation, lineup.starters) ?? (isTactic(lineup.tactic) ? null : 'unknown tactic'),
  playMatch: (club, opponent, seed, decisions) => playClubMatch(club, opponent, seed, decisions),
};

export const isBasketballFormation = (value: string): value is BasketballFormation => value in BASKETBALL_FORMATIONS;
export const isTactic = (value: string): value is BasketballTactic => (BASKETBALL_TACTICS as readonly string[]).includes(value);

const strongest = (players: readonly Player[], position: string, count: number, taken: ReadonlySet<number>): Player[] =>
  players.filter(player => player.position === position && !taken.has(player.id)).sort((a, b) => b.rating - a.rating || a.id - b.id).slice(0, count);

// The best five for a formation: the strongest of each position; a missing position is filled with the best that remain.
export function autoStarters(squad: readonly Player[], formation: BasketballFormation): number[] {
  const healthy = squad.filter(player => player.injuredUntil === undefined);
  const picked: Player[] = [];
  const taken = new Set<number>();
  const take = (players: Player[]) => players.forEach(player => (picked.push(player), taken.add(player.id)));
  for (const position of BASKETBALL_POSITIONS) take(strongest(healthy, position, BASKETBALL_FORMATIONS[formation][position], taken));
  const rest = healthy.filter(player => !taken.has(player.id)).sort((a, b) => b.rating - a.rating || a.id - b.id);
  while (picked.length < BASKETBALL.starters && rest.length > 0) take([rest.shift()!]);
  return picked.map(player => player.id);
}

// Five distinct players of the Squad, the positions the formation asks for.
export function lineupIssue(squad: readonly Player[], formation: string, starters: readonly number[]): string | null {
  if (!isBasketballFormation(formation)) return 'unknown formation';
  if (starters.length !== BASKETBALL.starters || new Set(starters).size !== BASKETBALL.starters) return 'five distinct starters needed';
  const players = starters.map(id => squad.find(player => player.id === id));
  if (players.some(player => player === undefined)) return 'unknown player';
  for (const position of BASKETBALL_POSITIONS) {
    if ((players as Player[]).filter(player => player.position === position).length !== BASKETBALL_FORMATIONS[formation][position]) return `the formation needs ${BASKETBALL_FORMATIONS[formation][position]} ${position}s`;
  }
  return null;
}

export interface SimPlayer {
  id: number;
  name: string;
  position: string;
  rating: number;
  form: number;
}

export interface BasketballSide {
  name: string;
  court: SimPlayer[];
  bench: SimPlayer[];
  tactic: BasketballTactic;
  substitutions: number;
}

export type BasketballEvent =
  | { minute: number; side: 0 | 1; type: 'two' | 'three' | 'freeThrows'; player: string; points: number }
  | { minute: number; side: 0 | 1; type: 'substitution'; player: string; replaced: string }
  | { minute: number; side: 0 | 1; type: 'tactic'; tactic: BasketballTactic };

export interface BasketballState {
  minute: number;
  score: [number, number];
  sides: [BasketballSide, BasketballSide];
  events: BasketballEvent[];
  rng: number;
  over: boolean;
}

const simPlayer = (player: Player): SimPlayer => ({ id: player.id, name: player.name, position: player.position, rating: player.rating, form: player.form });

const effective = (player: SimPlayer): number => player.rating * (0.9 + 0.2 * (player.form / 100));

const average = (players: readonly SimPlayer[], position: string): number => {
  const line = players.filter(player => player.position === position);
  return line.length === 0 ? 0 : line.reduce((total, player) => total + effective(player), 0) / line.length;
};

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

// The lineup the Club plays with: the one the player set when it is still valid, otherwise the best five.
export function effectiveLineup(club: ClubData): Lineup {
  const formation = club.lineup && isBasketballFormation(club.lineup.formation) ? club.lineup.formation : BASKETBALL.defaultFormation;
  const tactic = club.lineup && isTactic(club.lineup.tactic) ? club.lineup.tactic : BASKETBALL.defaultTactic;
  const valid = club.lineup !== undefined && lineupIssue(club.squad, club.lineup.formation, club.lineup.starters) === null;
  return { formation, tactic, starters: valid ? club.lineup!.starters : autoStarters(club.squad, formation) };
}

export function clubSide(club: ClubData): BasketballSide {
  const { starters, tactic: chosen } = effectiveLineup(club);
  const tactic = isTactic(chosen) ? chosen : BASKETBALL.defaultTactic;
  const court = starters.map(id => simPlayer(club.squad.find(player => player.id === id)!));
  const bench = club.squad.filter(player => !starters.includes(player.id) && player.injuredUntil === undefined).sort((a, b) => b.rating - a.rating || a.id - b.id).map(simPlayer);
  return { name: club.name, court, bench, tactic, substitutions: 0 };
}

// An opposing club has no Squad: every position plays at its strength.
export function opponentSide(opponent: Opponent): BasketballSide {
  const positions = ['guard', 'guard', 'wing', 'wing', 'center'];
  const make = (position: string, index: number): SimPlayer => ({ id: -(index + 1), name: opponent.name, position, rating: opponent.strength, form: 50 });
  return { name: opponent.name, court: positions.map(make), bench: [], tactic: BASKETBALL.defaultTactic, substitutions: 0 };
}

const attackOf = (side: BasketballSide): number => (0.4 * average(side.court, 'guard') + 0.35 * average(side.court, 'wing') + 0.25 * average(side.court, 'center')) * BASKETBALL.tactics[side.tactic].attack;

const defenceOf = (side: BasketballSide): number => (0.25 * average(side.court, 'guard') + 0.35 * average(side.court, 'wing') + 0.4 * average(side.court, 'center')) * BASKETBALL.tactics[side.tactic].defence;

export function startMatch(club: ClubData, opponent: Opponent, seed: number): BasketballState {
  return { minute: 0, score: [0, 0], sides: [clubSide(club), opponentSide(opponent)], events: [], rng: seed, over: false };
}

function applyDecision(state: BasketballState, decision: MatchDecision): BasketballState {
  const [mine, theirs] = state.sides;
  if (decision.kind === 'tactic') {
    if (!isTactic(decision.tactic) || decision.tactic === mine.tactic) return state;
    return { ...state, sides: [{ ...mine, tactic: decision.tactic }, theirs], events: [...state.events, { minute: state.minute, side: 0, type: 'tactic', tactic: decision.tactic }] };
  }
  if (mine.substitutions >= BASKETBALL.maxSubstitutions) return state;
  const leaving = mine.court.find(player => player.id === decision.out);
  const coming = mine.bench.find(player => player.id === decision.in);
  if (!leaving || !coming) return state;
  const court = mine.court.map(player => (player === leaving ? coming : player));
  const bench = [...mine.bench.filter(player => player !== coming), leaving];
  return { ...state, sides: [{ ...mine, court, bench, substitutions: mine.substitutions + 1 }, theirs], events: [...state.events, { minute: state.minute, side: 0, type: 'substitution', player: coming.name, replaced: leaving.name }] };
}

function playMinute(state: BasketballState): BasketballState {
  const minute = state.minute + 1;
  let rng = state.rng;
  const draw = () => {
    const next = nextRandom(rng);
    rng = next.rngState;
    return next.value;
  };
  let score = state.score;
  let events = state.events;
  const { sides } = state;
  const pace = (BASKETBALL.tactics[sides[0].tactic].pace + BASKETBALL.tactics[sides[1].tactic].pace) / 2;
  const expected = BASKETBALL.possessionsPerMinute * pace;
  const possessions = Math.floor(expected) + (draw() < expected - Math.floor(expected) ? 1 : 0);
  const addScore = (side: 0 | 1, points: number) => {
    score = side === 0 ? [score[0] + points, score[1]] : [score[0], score[1] + points];
  };
  for (let turn = 0; turn < possessions * 2; turn++) {
    const attacker: 0 | 1 = turn % 2 === 0 ? 0 : 1;
    const defender: 0 | 1 = attacker === 0 ? 1 : 0;
    if (draw() < BASKETBALL.turnover) continue;
    const shooter = sides[attacker].court[Math.floor(draw() * sides[attacker].court.length)]!;
    if (draw() < BASKETBALL.freeThrow) {
      const points = (draw() < BASKETBALL.freeThrowMake ? 1 : 0) + (draw() < BASKETBALL.freeThrowMake ? 1 : 0);
      if (points > 0) {
        events = [...events, { minute, side: attacker, type: 'freeThrows', player: shooter.name, points }];
        addScore(attacker, points);
      }
      continue;
    }
    const ratio = attackOf(sides[attacker]) / defenceOf(sides[defender]);
    const three = draw() < BASKETBALL.tactics[sides[attacker].tactic].threes;
    const chance = clamp((three ? BASKETBALL.threeBase : BASKETBALL.twoBase) * ratio ** BASKETBALL.ratioPower, BASKETBALL.makeMin, BASKETBALL.makeMax);
    if (draw() >= chance) continue;
    const points = three ? 3 : 2;
    events = [...events, { minute, side: attacker, type: three ? 'three' : 'two', player: shooter.name, points }];
    addScore(attacker, points);
  }
  const lastMinute = BASKETBALL.minutes + BASKETBALL.maxOvertimes * BASKETBALL.overtimeMinutes;
  const periodEnd = minute >= BASKETBALL.minutes && (minute - BASKETBALL.minutes) % BASKETBALL.overtimeMinutes === 0;
  const over = periodEnd && (score[0] !== score[1] || minute >= lastMinute);
  return { ...state, minute, score, events, rng, over };
}

// Plays the Match up to a minute, the decisions taken at or before each minute applied as it comes. A tie at the end of the fourth quarter goes to five-minute overtimes, and a tie after the last one to the stronger side's last shot.
export function playUntil(club: ClubData, opponent: Opponent, seed: number, decisions: readonly MatchDecision[], until = Infinity): BasketballState {
  let state = startMatch(club, opponent, seed);
  const ordered = [...decisions].sort((a, b) => a.minute - b.minute);
  let next = 0;
  while (!state.over && state.minute < until) {
    while (next < ordered.length && ordered[next]!.minute <= state.minute) state = applyDecision(state, ordered[next++]!);
    state = playMinute(state);
  }
  if (state.over && state.score[0] === state.score[1]) {
    const edge = attackOf(state.sides[0]) / (attackOf(state.sides[0]) + attackOf(state.sides[1]));
    const last = nextRandom(state.rng);
    state = { ...state, rng: last.rngState, score: last.value < edge ? [state.score[0] + 1, state.score[1]] : [state.score[0], state.score[1] + 1] };
  }
  return state;
}

function playClubMatch(club: ClubData, opponent: Opponent, seed: number, decisions: readonly MatchDecision[] = []): MatchReport {
  const state = playUntil(club, opponent, seed, decisions);
  return { result: state.score[0] > state.score[1] ? 'win' : 'loss', score: state.score };
}
