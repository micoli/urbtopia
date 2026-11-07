import { describe, expect, it } from 'vitest';
import { advance, createBuilding, createClub, dispatch, fixtureSeedOf, newGame, type ClubData, type Command, type GameState, type MatchDecision, type Opponent } from '../../index';
import { BASKETBALL, BASKETBALL_FORMATIONS, BASKETBALL_FORMATION_IDS, BASKETBALL_RULES, BASKETBALL_TACTICS, autoStarters, clubSide, lineupIssue, playUntil } from './basketball';

const founded = (seed = 'bb'): ClubData => createClub(BASKETBALL_RULES, 'Harbour Hoops', seed);
const rated = (club: ClubData, rating: number): ClubData => ({ ...club, squad: club.squad.map(player => ({ ...player, rating })) });
const opponent = (strength: number): Opponent => ({ name: 'Northgate Wolves', strength, points: 0 });
const pointsOver = (club: ClubData, against: Opponent, matches = 60) =>
  Array.from({ length: matches }, (_, seed) => playUntil(club, against, seed + 1, []).score).reduce((total, score) => [total[0] + score[0], total[1] + score[1]] as [number, number], [0, 0] as [number, number]);

describe('Basketball rules', () => {
  it('fields thirteen players: five guards, five wings and three centers', () => {
    const { squad } = founded();
    expect(squad).toHaveLength(13);
    expect(squad.filter(player => player.position === 'guard')).toHaveLength(5);
    expect(squad.filter(player => player.position === 'wing')).toHaveLength(5);
    expect(squad.filter(player => player.position === 'center')).toHaveLength(3);
  });

  it('has three formations of five players', () => {
    expect(BASKETBALL_FORMATION_IDS).toEqual(['2-2-1', '3-1-1', '1-2-2']);
    for (const formation of BASKETBALL_FORMATION_IDS) expect(Object.values(BASKETBALL_FORMATIONS[formation]).reduce((a, b) => a + b, 0)).toBe(5);
  });

  it('picks the best five for each formation', () => {
    const { squad } = founded();
    for (const formation of BASKETBALL_FORMATION_IDS) {
      const starters = autoStarters(squad, formation);
      expect(starters).toHaveLength(5);
      expect(lineupIssue(squad, formation, starters)).toBeNull();
    }
  });

  it('refuses a lineup with the wrong positions, a duplicate or an unknown player', () => {
    const { squad } = founded();
    const starters = autoStarters(squad, '2-2-1');
    expect(lineupIssue(squad, '3-1-1', starters)).not.toBeNull();
    expect(lineupIssue(squad, '2-2-1', [...starters.slice(0, 4), starters[0]!])).toBe('five distinct starters needed');
    expect(lineupIssue(squad, '2-2-1', [...starters.slice(0, 4), 9999])).toBe('unknown player');
    expect(lineupIssue(squad, 'nope', starters)).toBe('unknown formation');
  });
});

describe('Basketball simulation', () => {
  it('plays the same Match from the same seed and decisions, the 48 minutes at least', () => {
    const club = founded();
    expect(playUntil(club, opponent(55), 7, [])).toEqual(playUntil(club, opponent(55), 7, []));
    expect(playUntil(club, opponent(55), 7, []).minute).toBeGreaterThanOrEqual(BASKETBALL.minutes);
    expect(playUntil(club, opponent(55), 7, [], 20).minute).toBe(20);
  });

  it('is a prefix: playing to a minute gives the start of the full Match', () => {
    const club = founded();
    const full = playUntil(club, opponent(55), 9, []);
    const part = playUntil(club, opponent(55), 9, [], 24);
    expect(full.events.slice(0, part.events.length)).toEqual(part.events);
  });

  it('never ends level and scores like a basketball game', () => {
    const club = founded();
    for (let seed = 1; seed <= 40; seed++) {
      const { score, over } = playUntil(club, opponent(55), seed, []);
      expect(over).toBe(true);
      expect(score[0]).not.toBe(score[1]);
      expect(score[0]).toBeGreaterThan(55);
      expect(score[0]).toBeLessThan(150);
    }
  });

  it('scores more for a stronger Squad, and concedes less', () => {
    const strong = pointsOver(rated(founded(), 85), opponent(50));
    const weak = pointsOver(rated(founded(), 35), opponent(50));
    expect(strong[0]).toBeGreaterThan(weak[0]);
    expect(strong[1]).toBeLessThan(weak[1]);
    expect(strong[0]).toBeGreaterThan(strong[1]);
  });

  it('plays faster and shoots more threes on the matching tactics', () => {
    const club = rated(founded(), 60);
    const withTactic = (tactic: string): ClubData => ({ ...club, lineup: { formation: '2-2-1', starters: autoStarters(club.squad, '2-2-1'), tactic } });
    const threes = (tactic: string) => Array.from({ length: 40 }, (_, seed) => playUntil(withTactic(tactic), opponent(60), seed + 1, []).events.filter(event => event.side === 0 && event.type === 'three').length).reduce((a, b) => a + b, 0);
    expect(threes('threePoint')).toBeGreaterThan(threes('defensive'));
    const total = (tactic: string) => pointsOver(withTactic(tactic), opponent(60), 40).reduce((a, b) => a + b, 0);
    expect(total('fastBreak')).toBeGreaterThan(total('defensive'));
  });

  it('changes tactic and substitutes bench players only, up to the limit', () => {
    const club = founded();
    const side = clubSide(club);
    const [first, second] = side.court;
    const [benchFirst, benchSecond] = side.bench;
    const decisions: MatchDecision[] = [
      { minute: 10, kind: 'tactic', tactic: 'threePoint' },
      { minute: 20, kind: 'substitute', out: first!.id, in: benchFirst!.id },
      { minute: 30, kind: 'substitute', out: second!.id, in: benchSecond!.id },
      { minute: 40, kind: 'substitute', out: side.court[2]!.id, in: 9999 },
    ];
    const state = playUntil(club, opponent(55), 3, decisions);
    expect(state.sides[0].tactic).toBe('threePoint');
    expect(state.sides[0].substitutions).toBe(2);
    expect(state.events.filter(event => event.type === 'substitution')).toHaveLength(2);
    expect(state.sides[0].court.map(player => player.id)).toContain(benchFirst!.id);
  });
});

describe('Basketball balance', () => {
  const winRate = (club: ClubData, against: Opponent, matches = 300) => Array.from({ length: matches }, (_, seed) => playUntil(club, against, (seed + 1) * 7919, []).score).filter(score => score[0] > score[1]).length / matches;
  const withTactic = (club: ClubData, tactic: string): ClubData => ({ ...club, lineup: { formation: '2-2-1', starters: autoStarters(club.squad, '2-2-1'), tactic } });

  it('wins about three Matches in four with ten more rating, and almost always with thirty more', () => {
    expect(winRate(rated(founded(), 60), opponent(50))).toBeGreaterThan(0.68);
    expect(winRate(rated(founded(), 60), opponent(50))).toBeLessThan(0.88);
    expect(winRate(rated(founded(), 80), opponent(50))).toBeGreaterThan(0.93);
  });

  it('keeps an underdog in the game: ten less rating still wins now and then', () => {
    expect(winRate(rated(founded(), 50), opponent(60))).toBeGreaterThan(0.12);
  });

  it('lets no tactic dominate at equal strength', () => {
    for (const tactic of BASKETBALL_TACTICS) {
      const rate = winRate(withTactic(rated(founded(), 60), tactic), opponent(60));
      expect(rate, tactic).toBeGreaterThan(0.4);
      expect(rate, tactic).toBeLessThan(0.62);
    }
  });

  it('scores more points on a fast break than on a defensive tactic', () => {
    const total = (tactic: string) => Array.from({ length: 80 }, (_, seed) => playUntil(withTactic(rated(founded(), 60), tactic), opponent(60), seed + 1, []).score).reduce((sum, score) => sum + score[0] + score[1], 0) / 80;
    expect(total('fastBreak')).toBeGreaterThan(total('defensive') + 15);
  });
});

describe('Basketball in the Championship', () => {
  const city = (): GameState => ({ ...newGame({ seed: 'basketball-city', now: 0 }), nextId: 100, urbs: 10_000, tutorial: null, adaptationUntil: 0, lastSeen: 0, buildings: [createBuilding(1, 'basketballArena', 60, 60, 0)] });
  const send = (state: GameState, command: Command) => {
    const result = dispatch(state, command, state.lastSeen);
    if (!result.ok) throw new Error(result.error.key);
    return result.state;
  };

  it('founds a basketball Club and settles a Match with a score, the same each time', () => {
    const state = send(city(), { type: 'FoundClub', buildingId: 1 });
    expect(state.buildings[0]!.club!.sport).toBe('basketball');
    const first = state.buildings[0]!.club!.championship!.fixtures[0]!.at;
    const played = advance(state, first + 3 * 3_600_000).state.buildings[0]!.club!.championship!.fixtures[0]!;
    expect(played.score).toBeDefined();
    expect(played.result === 'win' || played.result === 'loss').toBe(true);
    const again = advance(state, first + 3 * 3_600_000).state.buildings[0]!.club!.championship!.fixtures[0]!;
    expect(again.score).toEqual(played.score);
  });

  it('sets a valid lineup through the command and refuses an invalid one', () => {
    const state = send(city(), { type: 'FoundClub', buildingId: 1 });
    const club = state.buildings[0]!.club!;
    const starters = autoStarters(club.squad, '3-1-1');
    const set = send(state, { type: 'SetLineup', buildingId: 1, formation: '3-1-1', starters, tactic: 'fastBreak' });
    expect(set.buildings[0]!.club!.lineup).toEqual({ formation: '3-1-1', starters, tactic: 'fastBreak' });
    expect(dispatch(state, { type: 'SetLineup', buildingId: 1, formation: '2-2-1', starters, tactic: 'balanced' }, 0).ok).toBe(false);
  });

  it('replays the recorded decisions when the Match is settled', () => {
    const state = send(city(), { type: 'FoundClub', buildingId: 1 });
    const club = state.buildings[0]!.club!;
    const first = club.championship!.fixtures[0]!.at;
    const side = clubSide(club);
    const decisions: MatchDecision[] = [{ minute: 5, kind: 'tactic', tactic: 'fastBreak' }, { minute: 30, kind: 'substitute', out: side.court[3]!.id, in: side.bench[0]!.id }];
    const recorded = send({ ...state, lastSeen: first + 1 }, { type: 'PlayMatch', buildingId: 1, decisions });
    const settled = advance(recorded, first + 3 * 3_600_000).state.buildings[0]!.club!.championship!.fixtures[0]!;
    expect(settled.score).toEqual(playUntil(club, club.championship!.opponents[0]!, fixtureSeedOf(club, 0), decisions).score);
  });
});
