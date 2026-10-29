import { hashSeed, nextRandom } from '../engine/random';
import { FIRST_NAMES, LAST_NAMES } from './names';
import type { ClubData, ClubError, ClubSport, Player, SportRules } from './clubTypes';

export const CLUB = {
  startBudget: 5000,
  marketSize: 6,
  contractYears: 3,
  hoursPerDay: 24,
  ageRange: [18, 34] as readonly [number, number],
  // Urbs a day for a player of rating 50; the wage grows with the square of the rating.
  wageAtFifty: 20,
  // A released player costs this many days of wages.
  severanceDays: 5,
  // A player sells for this many days of wages, times the age factor.
  valueDays: 200,
  // The budget may sink to this much below zero before the best players are sold.
  debtLimit: 0,
  // Share of the Takings of the stadium that goes to the Club budget.
  takingsShare: 0.3,
};

export type ClubOutcome = { club: ClubData } | { error: ClubError };

const roll = (club: Pick<ClubData, 'rng'>) => nextRandom(club.rng);

export const wageOf = (rating: number): number => Math.max(1, Math.round(CLUB.wageAtFifty * (rating / 50) ** 2));

const ageFactor = (age: number): number => (age <= 24 ? 1.3 : age <= 29 ? 1 : age <= 32 ? 0.7 : 0.4);

export const marketValueOf = (player: Pick<Player, 'rating' | 'age'>): number => Math.round(wageOf(player.rating) * CLUB.valueDays * ageFactor(player.age));

export const signingFeeOf = (player: Pick<Player, 'rating' | 'age'>): number => marketValueOf(player);

export const severanceOf = (player: Pick<Player, 'rating'>): number => wageOf(player.rating) * CLUB.severanceDays;

function generatePlayer(rules: SportRules, club: ClubData, position: string): { player: Player; club: ClubData } {
  let rng = club.rng;
  const draw = () => {
    const next = nextRandom(rng);
    rng = next.rngState;
    return next.value;
  };
  const [low, high] = rules.ratingRange;
  const rating = Math.round(low + (high - low) * ((draw() + draw()) / 2));
  const age = CLUB.ageRange[0] + Math.floor(draw() * (CLUB.ageRange[1] - CLUB.ageRange[0] + 1));
  const name = `${FIRST_NAMES[Math.floor(draw() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(draw() * LAST_NAMES.length)]}`;
  const player: Player = {
    id: club.nextPlayerId,
    name,
    position,
    rating,
    form: 50,
    morale: 50,
    age,
    contract: { untilYear: club.year + CLUB.contractYears - 1, wage: wageOf(rating) },
    history: [],
  };
  return { player, club: { ...club, rng, nextPlayerId: club.nextPlayerId + 1 } };
}

const positionsOf = (rules: SportRules): string[] => Object.entries(rules.composition).flatMap(([position, count]) => Array.from({ length: count }, () => position));

// A new Club with its starting Squad, drawn from a seed so a city always founds the same one.
export function createClub(rules: SportRules, name: string, seed: string): ClubData {
  let club: ClubData = { sport: rules.sport, name, budget: CLUB.startBudget, year: 1, fame: 1, squad: [], market: [], nextPlayerId: 1, rng: hashSeed(`club:${seed}`) };
  for (const position of positionsOf(rules)) {
    const made = generatePlayer(rules, club, position);
    club = { ...made.club, squad: [...made.club.squad, made.player] };
  }
  return refreshMarket(rules, club);
}

// The yearly recruitment market: new players of random positions, the old ones leave.
export function refreshMarket(rules: SportRules, club: ClubData): ClubData {
  const positions = Object.keys(rules.composition);
  let next = { ...club, market: [] as Player[] };
  for (let index = 0; index < CLUB.marketSize; index++) {
    const draw = roll(next);
    const made = generatePlayer(rules, { ...next, rng: draw.rngState }, positions[Math.floor(draw.value * positions.length)]!);
    next = { ...made.club, market: [...next.market, made.player] };
  }
  return next;
}

export function signPlayer(rules: SportRules, club: ClubData, playerId: number): ClubOutcome {
  const player = club.market.find(candidate => candidate.id === playerId);
  if (!player) return { error: 'error.unknownPlayer' };
  if (club.squad.length >= rules.squadMax) return { error: 'error.squadFull' };
  const fee = signingFeeOf(player);
  if (club.budget < fee) return { error: 'error.notEnoughBudget' };
  const signed: Player = { ...player, contract: { untilYear: club.year + CLUB.contractYears - 1, wage: wageOf(player.rating) } };
  return { club: { ...club, budget: club.budget - fee, squad: [...club.squad, signed], market: club.market.filter(candidate => candidate !== player) } };
}

export function releasePlayer(rules: SportRules, club: ClubData, playerId: number): ClubOutcome {
  const player = club.squad.find(candidate => candidate.id === playerId);
  if (!player) return { error: 'error.unknownPlayer' };
  if (club.squad.length <= rules.squadMin) return { error: 'error.squadTooSmall' };
  const severance = severanceOf(player);
  if (club.budget < severance) return { error: 'error.notEnoughBudget' };
  return { club: { ...club, budget: club.budget - severance, squad: club.squad.filter(candidate => candidate !== player) } };
}

export const wagesPerDay = (club: Pick<ClubData, 'squad'>): number => club.squad.reduce((total, player) => total + player.contract.wage, 0);

// The Club pays its Squad by the hour. In debt it sells its best player, never going bankrupt: the Squad shrinks to its minimum and no further.
export function advanceClub(rules: SportRules, club: ClubData, hours: number): ClubData {
  if (hours <= 0) return club;
  let next = { ...club, budget: club.budget - (wagesPerDay(club) / CLUB.hoursPerDay) * hours };
  while (next.budget < CLUB.debtLimit && next.squad.length > rules.squadMin) {
    const [best] = [...next.squad].sort((a, b) => b.rating - a.rating || a.id - b.id);
    next = { ...next, budget: next.budget + marketValueOf(best!), squad: next.squad.filter(player => player !== best) };
  }
  return next.budget < CLUB.debtLimit ? { ...next, budget: CLUB.debtLimit } : next;
}

export const isClubSport = (value: unknown): value is ClubSport => value === 'football' || value === 'baseball';
