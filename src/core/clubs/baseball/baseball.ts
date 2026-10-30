import { nextRandom } from '../../engine/random';
import type { ClubData, Lineup, MatchDecision, MatchReport, Opponent, Player, SportRules } from '../clubTypes';

export const BASEBALL_POSITIONS = ['pitcher', 'catcher', 'infielder', 'outfielder'] as const;

// The nine hitters: one catcher, four infielders and four outfielders. The starting pitcher is chosen apart and does not bat.
export const HITTERS = { catcher: 1, infielder: 4, outfielder: 4 } as const;

export const APPROACHES = ['contact', 'balanced', 'power'] as const;
export type Approach = (typeof APPROACHES)[number];

export const BASEBALL = {
  hitters: 9,
  innings: 9,
  extraInnings: 3,
  maxPitcherChanges: 3,
  defaultApproach: 'balanced' as Approach,
  walk: 0.08,
  hit: 0.24,
  homerShare: 0.12,
  doubleShare: 0.2,
  pitchesPerPlate: 4,
  tiredAfter: 100,
  // Share of the strength a worn-out pitcher loses at most.
  maxTiredness: 0.4,
  // Hit chance, power and outs by batting approach.
  approaches: { contact: { hit: 1.08, homer: 0.7 }, balanced: { hit: 1, homer: 1 }, power: { hit: 0.94, homer: 1.6 } } as Record<Approach, { hit: number; homer: number }>,
};

export const BASEBALL_RULES: SportRules = {
  sport: 'baseball',
  squadMin: 13,
  squadMax: 24,
  composition: { pitcher: 6, catcher: 2, infielder: 6, outfielder: 6 },
  ratingRange: [35, 90],
  draws: false,
  lineupIssue: (club, lineup) => lineupIssue(club.squad, lineup.starters) ?? (isApproach(lineup.tactic) ? null : 'unknown approach'),
  playMatch: (club, opponent, seed, decisions) => playClubMatch(club, opponent, seed, decisions),
};

export const isApproach = (value: string): value is Approach => (APPROACHES as readonly string[]).includes(value);

const best = (players: readonly Player[], position: string, count: number, taken: ReadonlySet<number>): Player[] =>
  players.filter(player => player.position === position && !taken.has(player.id)).sort((a, b) => b.rating - a.rating || a.id - b.id).slice(0, count);

// The starting pitcher, then nine hitters in a batting order that puts the best first.
export function autoStarters(squad: readonly Player[]): number[] {
  const healthy = squad.filter(player => player.injuredUntil === undefined);
  const taken = new Set<number>();
  const picked: Player[] = [];
  const take = (players: Player[]) => players.forEach(player => (picked.push(player), taken.add(player.id)));
  take(best(healthy, 'pitcher', 1, taken));
  const hitters: Player[] = [];
  for (const position of ['catcher', 'infielder', 'outfielder'] as const) hitters.push(...best(healthy, position, HITTERS[position], taken));
  hitters.forEach(player => taken.add(player.id));
  const rest = healthy.filter(player => !taken.has(player.id) && player.position !== 'pitcher').sort((a, b) => b.rating - a.rating || a.id - b.id);
  while (hitters.length < BASEBALL.hitters && rest.length > 0) hitters.push(rest.shift()!);
  return [...picked, ...hitters.sort((a, b) => b.rating - a.rating || a.id - b.id)].map(player => player.id);
}

// A pitcher first, then nine distinct hitters, a catcher among them.
export function lineupIssue(squad: readonly Player[], starters: readonly number[]): string | null {
  if (starters.length !== BASEBALL.hitters + 1 || new Set(starters).size !== starters.length) return 'a pitcher and nine distinct hitters needed';
  const players = starters.map(id => squad.find(player => player.id === id));
  if (players.some(player => player === undefined)) return 'unknown player';
  const [pitcher, ...hitters] = players as Player[];
  if (pitcher!.position !== 'pitcher') return 'a pitcher must come first';
  if (hitters.some(hitter => hitter.position === 'pitcher')) return 'a pitcher cannot bat';
  if (!hitters.some(hitter => hitter.position === 'catcher')) return 'a catcher is needed';
  return null;
}

export function effectiveLineup(club: ClubData): Lineup {
  const valid = club.lineup !== undefined && lineupIssue(club.squad, club.lineup.starters) === null;
  const tactic = club.lineup && isApproach(club.lineup.tactic) ? club.lineup.tactic : BASEBALL.defaultApproach;
  return { formation: 'standard', tactic, starters: valid ? club.lineup!.starters : autoStarters(club.squad) };
}

export interface SimPlayer {
  id: number;
  name: string;
  position: string;
  rating: number;
  form: number;
}

export interface BaseballSide {
  name: string;
  pitcher: SimPlayer;
  bullpen: SimPlayer[];
  lineup: SimPlayer[];
  approach: Approach;
  changes: number;
  // Index of the next batter.
  next: number;
  pitches: number;
}

export type BaseballEvent =
  // `outs` and `bases` are the state after the play: the outs of the half-inning and the runners on first, second and third.
  | { inning: number; half: 0 | 1; side: 0 | 1; type: 'single' | 'double' | 'homer' | 'walk' | 'strikeout' | 'out'; player: string; runs: number; outs: number; bases: readonly [boolean, boolean, boolean] }
  | { inning: number; half: 0 | 1; side: 0 | 1; type: 'change'; player: string; replaced: string }
  | { inning: number; half: 0 | 1; side: 0 | 1; type: 'approach'; approach: Approach };

export interface BaseballState {
  // Innings played in full.
  inning: number;
  score: [number, number];
  sides: [BaseballSide, BaseballSide];
  events: BaseballEvent[];
  rng: number;
  over: boolean;
}

const simPlayer = (player: Player): SimPlayer => ({ id: player.id, name: player.name, position: player.position, rating: player.rating, form: player.form });

export function clubSide(club: ClubData): BaseballSide {
  const { starters, tactic } = effectiveLineup(club);
  const [pitcherId, ...hitterIds] = starters;
  const byId = (id: number) => simPlayer(club.squad.find(player => player.id === id)!);
  const bullpen = club.squad.filter(player => player.position === 'pitcher' && player.id !== pitcherId && player.injuredUntil === undefined).sort((a, b) => b.rating - a.rating || a.id - b.id).map(simPlayer);
  return { name: club.name, pitcher: byId(pitcherId!), bullpen, lineup: hitterIds.map(byId), approach: isApproach(tactic) ? tactic : BASEBALL.defaultApproach, changes: 0, next: 0, pitches: 0 };
}

export function opponentSide(opponent: Opponent): BaseballSide {
  const make = (position: string, index: number): SimPlayer => ({ id: -(index + 1), name: opponent.name, position, rating: opponent.strength, form: 50 });
  return { name: opponent.name, pitcher: make('pitcher', 0), bullpen: [], lineup: Array.from({ length: BASEBALL.hitters }, (_, index) => make('infielder', index + 1)), approach: BASEBALL.defaultApproach, changes: 0, next: 0, pitches: 0 };
}

export function startMatch(club: ClubData, opponent: Opponent, seed: number): BaseballState {
  return { inning: 0, score: [0, 0], sides: [clubSide(club), opponentSide(opponent)], events: [], rng: seed, over: false };
}

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

const effective = (player: SimPlayer): number => player.rating * (0.9 + 0.2 * (player.form / 100));

const tiredness = (pitches: number): number => clamp((pitches - BASEBALL.tiredAfter) / 200, 0, BASEBALL.maxTiredness);

function applyDecision(state: BaseballState, decision: MatchDecision): BaseballState {
  const [mine, theirs] = state.sides;
  const stamp = { inning: state.inning + 1, half: 0 as const, side: 0 as const };
  if (decision.kind === 'tactic') {
    if (!isApproach(decision.tactic) || decision.tactic === mine.approach) return state;
    return { ...state, sides: [{ ...mine, approach: decision.tactic }, theirs], events: [...state.events, { ...stamp, type: 'approach', approach: decision.tactic }] };
  }
  if (mine.changes >= BASEBALL.maxPitcherChanges || decision.out !== mine.pitcher.id) return state;
  const coming = mine.bullpen.find(player => player.id === decision.in);
  if (!coming) return state;
  const bullpen = mine.bullpen.filter(player => player !== coming);
  return { ...state, sides: [{ ...mine, pitcher: coming, bullpen, changes: mine.changes + 1, pitches: 0 }, theirs], events: [...state.events, { ...stamp, type: 'change', player: coming.name, replaced: mine.pitcher.name }] };
}

type Bases = [boolean, boolean, boolean];

// One half-inning: the side at bat plays until three are out. Returns the new state.
function playHalf(state: BaseballState, half: 0 | 1): BaseballState {
  const batting: 0 | 1 = half === 0 ? 1 : 0;
  const fielding: 0 | 1 = batting === 0 ? 1 : 0;
  let rng = state.rng;
  const draw = () => {
    const next = nextRandom(rng);
    rng = next.rngState;
    return next.value;
  };
  let sides = state.sides;
  let score = state.score;
  let events = state.events;
  const inning = state.inning + 1;
  let outs = 0;
  let bases: Bases = [false, false, false];
  while (outs < 3) {
    const at = sides[batting];
    const defence = sides[fielding];
    const batter = at.lineup[at.next % at.lineup.length]!;
    const ratio = effective(batter) / (effective(defence.pitcher) * (1 - tiredness(defence.pitches)));
    const approach = BASEBALL.approaches[at.approach];
    const walk = clamp(BASEBALL.walk / Math.sqrt(ratio), 0.03, 0.15);
    const hit = clamp(BASEBALL.hit * ratio ** 1.4 * approach.hit, 0.08, 0.5);
    const roll = draw();
    let runs = 0;
    let type: 'single' | 'double' | 'homer' | 'walk' | 'strikeout' | 'out';
    if (roll < walk) {
      type = 'walk';
      if (bases[0] && bases[1] && bases[2]) runs = 1;
      bases = [true, bases[0] || bases[1], bases[0] && bases[1] ? true : bases[2]];
    } else if (roll < walk + hit) {
      const kind = draw();
      const homer = clamp(BASEBALL.homerShare * approach.homer, 0, 0.4);
      if (kind < homer) {
        type = 'homer';
        runs = 1 + bases.filter(Boolean).length;
        bases = [false, false, false];
      } else if (kind < homer + BASEBALL.doubleShare) {
        type = 'double';
        runs = (bases[1] ? 1 : 0) + (bases[2] ? 1 : 0);
        bases = [false, true, bases[0]];
      } else {
        type = 'single';
        runs = (bases[2] ? 1 : 0) + (bases[1] ? 1 : 0);
        bases = [true, bases[0], false];
      }
    } else {
      type = draw() < 0.45 ? 'strikeout' : 'out';
      outs += 1;
    }
    sides = (batting === 0 ? [{ ...at, next: at.next + 1 }, { ...defence, pitches: defence.pitches + BASEBALL.pitchesPerPlate }] : [{ ...defence, pitches: defence.pitches + BASEBALL.pitchesPerPlate }, { ...at, next: at.next + 1 }]) as [BaseballSide, BaseballSide];
    if (runs > 0) score = batting === 0 ? [score[0] + runs, score[1]] : [score[0], score[1] + runs];
    events = [...events, { inning, half, side: batting, type, player: batter.name, runs, outs, bases: [...bases] }];
    // A walk-off: the home side takes the lead in the last inning or later.
    if (batting === 0 && inning >= BASEBALL.innings && score[0] > score[1]) return { ...state, sides, score, events, rng, over: true, inning: inning - 1 };
  }
  return { ...state, sides, score, events, rng };
}

function playInning(state: BaseballState): BaseballState {
  let current = playHalf(state, 0);
  // The home side does not bat when it already leads after the top of the last inning.
  const lastInning = state.inning + 1 >= BASEBALL.innings;
  if (lastInning && current.score[0] > current.score[1]) return { ...current, inning: state.inning + 1, over: true };
  current = playHalf(current, 1);
  if (current.over) return { ...current, inning: state.inning + 1 };
  const finished = state.inning + 1;
  const over = finished >= BASEBALL.innings && current.score[0] !== current.score[1];
  return { ...current, inning: finished, over: over || finished >= BASEBALL.innings + BASEBALL.extraInnings };
}

// Plays the Match up to a number of innings, the decisions taken before each inning applied as it begins. A pitcher change is only taken between innings.
export function playUntil(club: ClubData, opponent: Opponent, seed: number, decisions: readonly MatchDecision[], untilInning = Infinity): BaseballState {
  let state = startMatch(club, opponent, seed);
  const ordered = [...decisions].sort((a, b) => a.minute - b.minute);
  let next = 0;
  while (!state.over && state.inning < untilInning) {
    while (next < ordered.length && ordered[next]!.minute <= state.inning) state = applyDecision(state, ordered[next++]!);
    state = playInning(state);
  }
  // A tie after the extra innings goes to the stronger side's last at-bat.
  if (state.over && state.score[0] === state.score[1]) {
    const edge = effective(state.sides[0].lineup[0]!) / (effective(state.sides[0].lineup[0]!) + effective(state.sides[1].lineup[0]!));
    const home = nextRandom(state.rng);
    state = { ...state, rng: home.rngState, score: home.value < edge ? [state.score[0] + 1, state.score[1]] : [state.score[0], state.score[1] + 1] };
  }
  return state;
}

function playClubMatch(club: ClubData, opponent: Opponent, seed: number, decisions: readonly MatchDecision[] = []): MatchReport {
  const state = playUntil(club, opponent, seed, decisions);
  return { result: state.score[0] > state.score[1] ? 'win' : 'loss', score: state.score };
}
