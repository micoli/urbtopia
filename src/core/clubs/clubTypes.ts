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
}

export type ClubError = 'error.unknownPlayer' | 'error.notEnoughBudget' | 'error.squadFull' | 'error.squadTooSmall' | 'error.noClub';
