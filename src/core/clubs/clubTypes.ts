export type ClubSport = 'football' | 'baseball';

export interface PlayerContract {
  // Last game year the contract covers.
  untilYear: number;
  // Urbs a day.
  wage: number;
}

// A year of a player's career with the Club.
export interface PlayerSeason {
  year: number;
  played: number;
}

export interface Player {
  id: number;
  name: string;
  position: string;
  // 1 to 100.
  rating: number;
  // 0 to 100: short-term shape, moves with the results.
  form: number;
  // 0 to 100.
  morale: number;
  age: number;
  contract: PlayerContract;
  history: PlayerSeason[];
  // Game time until which the player is injured.
  injuredUntil?: number;
}

// The Club of a stadium, all the individuals of its Squad included, so that a transfer market can grow from it without changing the save.
export type MatchResult = 'win' | 'draw' | 'loss';

export interface Opponent {
  name: string;
  // 1 to 100, drifts slowly from one Championship to the next.
  strength: number;
  points: number;
}

export interface Fixture {
  // Game time of the Match.
  at: number;
  opponent: number;
  result?: MatchResult;
  // Goals, runs or points: the Club's first.
  score?: readonly [number, number];
  // What the player decided while playing this Match.
  decisions?: readonly MatchDecision[];
}

// What the player decided during a Match, replayed by the simulation at the minute it was taken.
export type MatchDecision =
  | { readonly minute: number; readonly kind: 'tactic'; readonly tactic: string }
  | { readonly minute: number; readonly kind: 'substitute'; readonly out: number; readonly in: number };

// The lineup the player set: sport-specific values kept as plain data.
export interface Lineup {
  formation: string;
  // Player ids, in the order the sport reads them.
  starters: number[];
  tactic: string;
}

export interface MatchReport {
  result: MatchResult;
  score: readonly [number, number];
}

// One game year of Matches: a calendar, the opposing clubs and the points of the Club.
export interface ChampionshipData {
  fixtures: Fixture[];
  opponents: Opponent[];
  points: number;
}

export interface ClubData {
  sport: ClubSport;
  name: string;
  budget: number;
  year: number;
  // 1 to 5, like the Fame of an Artist: it moves with the results.
  fame: number;
  squad: Player[];
  market: Player[];
  nextPlayerId: number;
  rng: number;
  championship?: ChampionshipData;
  lineup?: Lineup;
}

// What a sport brings to the Club engine: how many players it fields and the positions it needs.
export interface SportRules {
  sport: ClubSport;
  squadMin: number;
  squadMax: number;
  // Players of each position in the starting Squad.
  composition: Readonly<Record<string, number>>;
  ratingRange: readonly [number, number];
  // Whether a Match can end level.
  draws: boolean;
  // Plays a Match of the Championship from a seed and what the player decided; without it the result follows the strength of the Squad.
  // Whether a lineup is valid for the sport, and why not.
  lineupIssue?: (club: ClubData, lineup: Lineup) => string | null;
  playMatch?: (club: ClubData, opponent: Opponent, seed: number, decisions?: readonly MatchDecision[]) => MatchReport;
}

export type ClubError = 'error.unknownPlayer' | 'error.notEnoughBudget' | 'error.squadFull' | 'error.squadTooSmall' | 'error.noClub';
