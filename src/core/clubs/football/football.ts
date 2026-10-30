import { nextRandom } from '../../engine/random';
import type { ClubData, Lineup, MatchDecision, MatchReport, MatchResult, Opponent, Player, SportRules } from '../clubTypes';

export const FOOTBALL_POSITIONS = ['goalkeeper', 'defender', 'midfielder', 'forward'] as const;
export type FootballPosition = (typeof FOOTBALL_POSITIONS)[number];

export const FORMATIONS = {
  '4-4-2': { defender: 4, midfielder: 4, forward: 2 },
  '4-3-3': { defender: 4, midfielder: 3, forward: 3 },
  '3-5-2': { defender: 3, midfielder: 5, forward: 2 },
  '5-3-2': { defender: 5, midfielder: 3, forward: 2 },
} as const;

export type Formation = keyof typeof FORMATIONS;

export const FORMATION_IDS = Object.keys(FORMATIONS) as Formation[];

export const TACTICS = ['defensive', 'balanced', 'attacking', 'pressing'] as const;
export type Tactic = (typeof TACTICS)[number];

export const FOOTBALL = {
  starters: 11,
  maxSubstitutions: 3,
  minutes: 90,
  chancePerMinute: 0.13,
  goalBase: 0.28,
  goalMin: 0.05,
  goalMax: 0.7,
  yellowPerMinute: 0.012,
  redPerMinute: 0.0012,
  redPenalty: 0.1,
  defaultFormation: '4-4-2' as Formation,
  defaultTactic: 'balanced' as Tactic,
  // Attack, defence and card risk by tactic.
  tactics: {
    defensive: { attack: 0.85, defence: 1.15, cards: 1 },
    balanced: { attack: 1, defence: 1, cards: 1 },
    attacking: { attack: 1.15, defence: 0.85, cards: 1 },
    pressing: { attack: 1.1, defence: 1, cards: 1.6 },
  } as Record<Tactic, { attack: number; defence: number; cards: number }>,
};

export const FOOTBALL_RULES: SportRules = {
  sport: 'football',
  squadMin: 14,
  squadMax: 22,
  composition: { goalkeeper: 2, defender: 6, midfielder: 6, forward: 4 },
  ratingRange: [35, 90],
  draws: true,
  lineupIssue: (club, lineup) => lineupIssue(club.squad, lineup.formation, lineup.starters) ?? (isTactic(lineup.tactic) ? null : 'unknown tactic'),
  playMatch: (club, opponent, seed, decisions) => playClubMatch(club, opponent, seed, decisions),
};

export const isFormation = (value: string): value is Formation => value in FORMATIONS;
export const isTactic = (value: string): value is Tactic => (TACTICS as readonly string[]).includes(value);

const strongest = (players: readonly Player[], position: string, count: number, taken: ReadonlySet<number>): Player[] =>
  players.filter(player => player.position === position && !taken.has(player.id)).sort((a, b) => b.rating - a.rating || a.id - b.id).slice(0, count);

// The best eleven for a formation: the strongest goalkeeper, then each line; a missing line is filled with the best that remain.
export function autoStarters(squad: readonly Player[], formation: Formation): number[] {
  const healthy = squad.filter(player => player.injuredUntil === undefined);
  const picked: Player[] = [];
  const taken = new Set<number>();
  const take = (players: Player[]) => players.forEach(player => (picked.push(player), taken.add(player.id)));
  take(strongest(healthy, 'goalkeeper', 1, taken));
  for (const position of ['defender', 'midfielder', 'forward'] as const) take(strongest(healthy, position, FORMATIONS[formation][position], taken));
  const rest = healthy.filter(player => !taken.has(player.id) && player.position !== 'goalkeeper').sort((a, b) => b.rating - a.rating || a.id - b.id);
  while (picked.length < FOOTBALL.starters && rest.length > 0) take([rest.shift()!]);
  return picked.map(player => player.id);
}

// Eleven distinct players of the Squad, a goalkeeper first, the lines the formation asks for.
export function lineupIssue(squad: readonly Player[], formation: string, starters: readonly number[]): string | null {
  if (!isFormation(formation)) return 'unknown formation';
  if (starters.length !== FOOTBALL.starters || new Set(starters).size !== FOOTBALL.starters) return 'eleven distinct starters needed';
  const players = starters.map(id => squad.find(player => player.id === id));
  if (players.some(player => player === undefined)) return 'unknown player';
  const lines = players as Player[];
  if (lines[0]!.position !== 'goalkeeper') return 'a goalkeeper must come first';
  for (const position of ['defender', 'midfielder', 'forward'] as const) {
    if (lines.filter(player => player.position === position).length !== FORMATIONS[formation][position]) return `the formation needs ${FORMATIONS[formation][position]} ${position}s`;
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

export interface MatchSide {
  name: string;
  pitch: SimPlayer[];
  bench: SimPlayer[];
  tactic: Tactic;
  substitutions: number;
  reds: number;
}

export type MatchEvent =
  | { minute: number; side: 0 | 1; type: 'chance' | 'goal' | 'yellow' | 'red'; player: string }
  | { minute: number; side: 0 | 1; type: 'substitution'; player: string; replaced: string }
  | { minute: number; side: 0 | 1; type: 'tactic'; tactic: Tactic };

export interface MatchState {
  minute: number;
  score: [number, number];
  sides: [MatchSide, MatchSide];
  events: MatchEvent[];
  rng: number;
}

const simPlayer = (player: Player): SimPlayer => ({ id: player.id, name: player.name, position: player.position, rating: player.rating, form: player.form });

const effective = (player: SimPlayer): number => player.rating * (0.9 + 0.2 * (player.form / 100));

const average = (players: readonly SimPlayer[], position: string): number => {
  const line = players.filter(player => player.position === position);
  return line.length === 0 ? 0 : line.reduce((total, player) => total + effective(player), 0) / line.length;
};

// The lineup the Club plays with: the one the player set when it is still valid, otherwise the best eleven.
export function effectiveLineup(club: ClubData): Lineup {
  const formation = club.lineup && isFormation(club.lineup.formation) ? club.lineup.formation : FOOTBALL.defaultFormation;
  const tactic = club.lineup && isTactic(club.lineup.tactic) ? club.lineup.tactic : FOOTBALL.defaultTactic;
  const valid = club.lineup !== undefined && lineupIssue(club.squad, club.lineup.formation, club.lineup.starters) === null;
  return { formation, tactic, starters: valid ? club.lineup!.starters : autoStarters(club.squad, formation) };
}

export function clubSide(club: ClubData): MatchSide {
  const { starters, tactic: chosen } = effectiveLineup(club);
  const tactic = isTactic(chosen) ? chosen : FOOTBALL.defaultTactic;
  const pitch = starters.map(id => simPlayer(club.squad.find(player => player.id === id)!));
  const bench = club.squad.filter(player => !starters.includes(player.id) && player.injuredUntil === undefined).sort((a, b) => b.rating - a.rating || a.id - b.id).map(simPlayer);
  return { name: club.name, pitch, bench, tactic, substitutions: 0, reds: 0 };
}

// An opposing club has no Squad: every position plays at its strength.
export function opponentSide(opponent: Opponent): MatchSide {
  const positions = ['goalkeeper', ...Array<string>(4).fill('defender'), ...Array<string>(4).fill('midfielder'), ...Array<string>(2).fill('forward')];
  const make = (position: string, index: number): SimPlayer => ({ id: -(index + 1), name: opponent.name, position, rating: opponent.strength, form: 50 });
  return { name: opponent.name, pitch: positions.map(make), bench: [], tactic: FOOTBALL.defaultTactic, substitutions: 0, reds: 0 };
}

const attackOf = (side: MatchSide): number => (0.6 * average(side.pitch, 'forward') + 0.4 * average(side.pitch, 'midfielder')) * FOOTBALL.tactics[side.tactic].attack * (1 - FOOTBALL.redPenalty * side.reds);

const defenceOf = (side: MatchSide): number => (0.5 * average(side.pitch, 'defender') + 0.2 * average(side.pitch, 'midfielder') + 0.3 * average(side.pitch, 'goalkeeper')) * FOOTBALL.tactics[side.tactic].defence * (1 - FOOTBALL.redPenalty * side.reds);

export function startMatch(club: ClubData, opponent: Opponent, seed: number): MatchState {
  return { minute: 0, score: [0, 0], sides: [clubSide(club), opponentSide(opponent)], events: [], rng: seed };
}

function applyDecision(state: MatchState, decision: MatchDecision): MatchState {
  const [mine, theirs] = state.sides;
  if (decision.kind === 'tactic') {
    if (!isTactic(decision.tactic) || decision.tactic === mine.tactic) return state;
    return { ...state, sides: [{ ...mine, tactic: decision.tactic }, theirs], events: [...state.events, { minute: state.minute, side: 0, type: 'tactic', tactic: decision.tactic }] };
  }
  if (mine.substitutions >= FOOTBALL.maxSubstitutions) return state;
  const leaving = mine.pitch.find(player => player.id === decision.out);
  const coming = mine.bench.find(player => player.id === decision.in);
  if (!leaving || !coming) return state;
  const pitch = mine.pitch.map(player => (player === leaving ? coming : player));
  const bench = mine.bench.filter(player => player !== coming);
  return { ...state, sides: [{ ...mine, pitch, bench, substitutions: mine.substitutions + 1 }, theirs], events: [...state.events, { minute: state.minute, side: 0, type: 'substitution', player: coming.name, replaced: leaving.name }] };
}

function playMinute(state: MatchState): MatchState {
  const minute = state.minute + 1;
  let rng = state.rng;
  const draw = () => {
    const next = nextRandom(rng);
    rng = next.rngState;
    return next.value;
  };
  let { score, sides, events } = { score: state.score, sides: state.sides, events: state.events };
  const pick = (side: MatchSide) => side.pitch[Math.floor(draw() * side.pitch.length)]!;
  if (draw() < FOOTBALL.chancePerMinute) {
    const [first, second] = [attackOf(sides[0]), attackOf(sides[1])];
    const attacker: 0 | 1 = draw() < first / (first + second) ? 0 : 1;
    const defender = attacker === 0 ? 1 : 0;
    const striker = pick(sides[attacker]);
    const scoring = Math.min(FOOTBALL.goalMax, Math.max(FOOTBALL.goalMin, FOOTBALL.goalBase * (attackOf(sides[attacker]) / defenceOf(sides[defender])) ** 1.5));
    const scored = draw() < scoring;
    events = [...events, { minute, side: attacker, type: scored ? 'goal' : 'chance', player: striker.name }];
    if (scored) score = attacker === 0 ? [score[0] + 1, score[1]] : [score[0], score[1] + 1];
  }
  for (const index of [0, 1] as const) {
    const risk = FOOTBALL.tactics[sides[index].tactic].cards;
    if (draw() < FOOTBALL.redPerMinute * risk) {
      const player = pick(sides[index]);
      events = [...events, { minute, side: index, type: 'red', player: player.name }];
      sides = index === 0 ? [{ ...sides[0], reds: sides[0].reds + 1 }, sides[1]] : [sides[0], { ...sides[1], reds: sides[1].reds + 1 }];
    } else if (draw() < FOOTBALL.yellowPerMinute * risk) events = [...events, { minute, side: index, type: 'yellow', player: pick(sides[index]).name }];
  }
  return { minute, score, sides, events, rng };
}

// Plays the Match up to a minute, the decisions taken at or before each minute applied as it comes.
export function playUntil(club: ClubData, opponent: Opponent, seed: number, decisions: readonly MatchDecision[], until = FOOTBALL.minutes): MatchState {
  let state = startMatch(club, opponent, seed);
  const ordered = [...decisions].sort((a, b) => a.minute - b.minute);
  let next = 0;
  while (state.minute < Math.min(until, FOOTBALL.minutes)) {
    while (next < ordered.length && ordered[next]!.minute <= state.minute) state = applyDecision(state, ordered[next++]!);
    state = playMinute(state);
  }
  return state;
}

export const resultOfScore = (score: readonly [number, number]): MatchResult => (score[0] > score[1] ? 'win' : score[0] < score[1] ? 'loss' : 'draw');

function playClubMatch(club: ClubData, opponent: Opponent, seed: number, decisions: readonly MatchDecision[] = []): MatchReport {
  const state = playUntil(club, opponent, seed, decisions);
  return { result: resultOfScore(state.score), score: state.score };
}
