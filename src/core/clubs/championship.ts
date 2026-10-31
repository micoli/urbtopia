import { hashSeed, nextRandom } from '../engine/random';
import type { Building, GameState } from '../engine/state';
import { GATHERING, MEETING_DRAW, isStadiumType, previewGathering, setGathering, type GatheringDraw, type GatheringPreview } from '../tourism/gatherings';
import { TOURISM } from '../tourism/tourists';
import { CLUB, refreshMarket, wageOf } from './club';
import type { ChampionshipData, ClubData, MatchResult, Opponent, SportRules } from './clubTypes';
import { OPPONENT_NAMES } from './names';
import { sportRulesOf } from './sportRules';

const HOUR_MS = 3_600_000;

export const CHAMPIONSHIP = {
  matches: 10,
  opponents: 7,
  matchIntervalMs: 6 * HOUR_MS,
  // The Match is set in the stadium this long before it starts, so its crowd can gather.
  leadMs: 2 * HOUR_MS,
  points: { win: 3, draw: 1, loss: 0 },
  // Urbs paid into the budget by ranking, first to last.
  prizes: [4000, 2500, 1500, 800, 400, 0, 0, 0] as readonly number[],
  strengthRange: [30, 80] as readonly [number, number],
  strengthDrift: 5,
  drawChance: 0.25,
  // A stadium with no Club: isolated Meetings, no ranking.
  meetingIntervalMs: 24 * HOUR_MS,
};

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

export const squadStrength = (club: Pick<ClubData, 'squad'>): number => (club.squad.length === 0 ? 0 : club.squad.reduce((total, player) => total + player.rating, 0) / club.squad.length);

// How good a Match looks: the Squad and the Fame of the Club.
export const clubQuality = (club: ClubData): number => clamp(0.5 * (squadStrength(club) / 100) + 0.5 * ((club.fame - 1) / 4), 0, 1);

function drawOpponents(rng: number, count: number): { opponents: Opponent[]; rng: number } {
  const names = [...OPPONENT_NAMES];
  const opponents: Opponent[] = [];
  let state = rng;
  for (let index = 0; index < count; index++) {
    const pick = nextRandom(state);
    const name = names.splice(Math.floor(pick.value * names.length), 1)[0]!;
    const strength = nextRandom(pick.rngState);
    state = strength.rngState;
    const [low, high] = CHAMPIONSHIP.strengthRange;
    opponents.push({ name, strength: Math.round(low + (high - low) * strength.value), points: 0 });
  }
  return { opponents, rng: state };
}

// A calendar of Matches one interval apart, the first one interval after `now`.
export function createChampionship(club: ClubData, now: number, opponents?: Opponent[]): { championship: ChampionshipData; rng: number } {
  const drawn = opponents ? { opponents: opponents.map(opponent => ({ ...opponent, points: 0 })), rng: club.rng } : drawOpponents(club.rng, CHAMPIONSHIP.opponents);
  const fixtures = Array.from({ length: CHAMPIONSHIP.matches }, (_, index) => ({ at: now + (index + 1) * CHAMPIONSHIP.matchIntervalMs, opponent: index % drawn.opponents.length }));
  return { championship: { fixtures, opponents: drawn.opponents, points: 0 }, rng: drawn.rng };
}

export const startChampionship = (club: ClubData, now: number): ClubData => {
  const { championship, rng } = createChampionship(club, now);
  return { ...club, championship, rng };
};

export const nextFixture = (championship: ChampionshipData) => championship.fixtures.find(fixture => fixture.result === undefined);

export const fixtureSeedOf = (club: Pick<ClubData, 'name' | 'year'>, index: number): number => hashSeed(`fixture:${club.name}:${club.year}:${index}`);

function resultOf(rules: SportRules, club: ClubData, opponent: Opponent, rng: number): { result: MatchResult; rng: number } {
  const first = nextRandom(rng);
  const strength = squadStrength(club);
  const edge = strength / (strength + opponent.strength);
  const draw = rules.draws ? CHAMPIONSHIP.drawChance : 0;
  const win = (1 - draw) * edge;
  const result: MatchResult = first.value < win ? 'win' : first.value < win + draw ? 'draw' : 'loss';
  return { result, rng: first.rngState };
}

const pointsOf = (result: MatchResult): number => CHAMPIONSHIP.points[result];

// The other clubs play each other too: each takes points by its strength.
function playOthers(rules: SportRules, opponents: Opponent[], rng: number): { opponents: Opponent[]; rng: number } {
  let state = rng;
  const next = opponents.map(opponent => {
    const draw = nextRandom(state);
    state = draw.rngState;
    const win = (1 - (rules.draws ? CHAMPIONSHIP.drawChance : 0)) * (opponent.strength / 100) * 0.9;
    const result: MatchResult = draw.value < win ? 'win' : rules.draws && draw.value < win + CHAMPIONSHIP.drawChance ? 'draw' : 'loss';
    return { ...opponent, points: opponent.points + pointsOf(result) };
  });
  return { opponents: next, rng: state };
}

export const clubRankOf = (championship: ChampionshipData): number => 1 + championship.opponents.filter(opponent => opponent.points > championship.points).length;

// End of the year: the prize, the Fame, a new market, one more year for everyone, and a new calendar.
function closeYear(rules: SportRules, club: ClubData, now: number): { club: ClubData; boost: boolean } {
  const championship = club.championship!;
  const rank = clubRankOf(championship);
  const prize = CHAMPIONSHIP.prizes[rank - 1] ?? 0;
  const fame = clamp(club.fame + (rank === 1 ? 1 : rank >= championship.opponents.length + 1 ? -1 : 0), 1, 5);
  let rng = club.rng;
  const opponents = championship.opponents.map(opponent => {
    const drift = nextRandom(rng);
    rng = drift.rngState;
    const [low, high] = CHAMPIONSHIP.strengthRange;
    return { ...opponent, strength: clamp(opponent.strength + Math.round((drift.value * 2 - 1) * CHAMPIONSHIP.strengthDrift), low, high) };
  });
  const year = club.year + 1;
  const squad = club.squad.map(player => {
    const renewed = player.contract.untilYear < year;
    return { ...player, age: player.age + 1, ...(renewed ? { contract: { untilYear: year + CLUB.contractYears - 1, wage: wageOf(player.rating) } } : {}) };
  });
  const next = refreshMarket(rules, { ...club, year, fame, budget: club.budget + prize, squad, rng });
  const created = createChampionship(next, now, opponents);
  return { club: { ...next, championship: created.championship, rng: created.rng }, boost: rank <= 3 };
}

function resolveDue(rules: SportRules, club: ClubData, now: number): { club: ClubData; boost: boolean } {
  let current = club;
  let boost = false;
  for (;;) {
    const championship = current.championship;
    const fixture = championship && nextFixture(championship);
    if (!championship || !fixture || fixture.at + GATHERING.matchDurationMs > now) return { club: current, boost };
    const opponent = championship.opponents[fixture.opponent]!;
    const report = rules.playMatch?.(current, opponent, fixtureSeedOf(current, championship.fixtures.indexOf(fixture)), fixture.decisions);
    const played = report ? { ...report, rng: current.rng } : resultOf(rules, current, opponent, current.rng);
    const others = playOthers(rules, championship.opponents, played.rng);
    const fixtures = championship.fixtures.map(candidate => (candidate === fixture ? { ...fixture, result: played.result, ...(report ? { score: report.score } : {}) } : candidate));
    current = { ...current, rng: others.rng, championship: { ...championship, fixtures, opponents: others.opponents, points: championship.points + pointsOf(played.result) } };
    if (nextFixture(current.championship!)) continue;
    const closed = closeYear(rules, current, fixture.at + GATHERING.matchDurationMs);
    current = closed.club;
    boost ||= closed.boost;
  }
}

export const nextMeetingSlot = (after: number): number => (Math.floor(after / CHAMPIONSHIP.meetingIntervalMs) + 1) * CHAMPIONSHIP.meetingIntervalMs;

const withAttraction = (building: Building, extra: Partial<NonNullable<Building['attraction']>>): Building => ({ ...building, attraction: { takings: building.attraction?.takings ?? 0, ...building.attraction, ...extra } });

const replace = (state: GameState, from: Building, to: Building): GameState => (from === to ? state : { ...state, buildings: state.buildings.map(building => (building === from ? to : building)) });

const drawOfStadium = (building: Building): GatheringDraw => {
  if (!building.club) return MEETING_DRAW;
  return { quality: clubQuality(building.club), crowdBoost: building.attraction?.nextMatchBoost ? TOURISM.championshipBoost : 1 };
};

// The crowd the next Match or Meeting of a stadium would draw at its current Ticket.
export const previewNextGathering = (state: GameState, building: Building): GatheringPreview => previewGathering(state, building, undefined, drawOfStadium(building));

// A stadium with no Club holds isolated Meetings on fixed days, with no ranking.
function advanceMeeting(state: GameState, building: Building, to: number): GameState {
  const slot = nextMeetingSlot(to);
  if (building.attraction?.gathering || building.attraction?.meetingAt === slot || to < slot - CHAMPIONSHIP.leadMs) return state;
  const planned = withAttraction(building, { meetingAt: slot });
  return setGathering(replace(state, building, planned), planned, 'meeting', slot, MEETING_DRAW);
}

// Sets the next Match of a Club in its stadium when its time comes, and settles those that were played.
function advanceClubMatches(state: GameState, building: Building, rules: SportRules, to: number): GameState {
  const resolved = resolveDue(rules, building.club!, to);
  let updated: Building = resolved.club === building.club ? building : { ...building, club: resolved.club };
  if (resolved.boost) updated = withAttraction(updated, { nextMatchBoost: true });
  const current = replace(state, building, updated);
  const fixture = nextFixture(updated.club!.championship!);
  if (!fixture || updated.attraction?.gathering || to < fixture.at - CHAMPIONSHIP.leadMs) return current;
  return setGathering(current, updated, 'match', fixture.at, drawOfStadium(updated));
}

// Calendars of Matches and Meetings: they set their Gatherings in the stadiums and settle the Matches that were played.
export function advanceChampionships(state: GameState, to: number): GameState {
  let current = state;
  for (const original of state.buildings) {
    if (!isStadiumType(original.type)) continue;
    const building = current.buildings.find(candidate => candidate.id === original.id)!;
    const rules = sportRulesOf(building.type);
    if (!building.club) current = advanceMeeting(current, building, to);
    else if (rules && building.club?.championship) current = advanceClubMatches(current, building, rules, to);
  }
  return current;
}

// Times after `after` at which a Match or Meeting is set, or a Match is settled.
export function championshipBoundaries(state: GameState, after: number): number[] {
  return state.buildings.flatMap(building => {
    const times: number[] = [];
    const fixture = building.club?.championship && nextFixture(building.club.championship);
    if (fixture) times.push(fixture.at - CHAMPIONSHIP.leadMs, fixture.at + GATHERING.matchDurationMs);
    if (isStadiumType(building.type) && !building.club) times.push(nextMeetingSlot(after) - CHAMPIONSHIP.leadMs);
    return times.filter(time => time > after);
  });
}
