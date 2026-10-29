import { describe, expect, it } from 'vitest';
import { advance, createBuilding, createClub, dispatch, fixtureSeedOf, newGame, type ClubData, type Command, type GameState, type MatchDecision, type Opponent } from '../../index';
import { FOOTBALL, FOOTBALL_RULES, FORMATIONS, FORMATION_IDS, autoStarters, clubSide, lineupIssue, playUntil, resultOfScore } from './football';

const founded = (seed = 'fb'): ClubData => createClub(FOOTBALL_RULES, 'Harbour Herons', seed);
const rated = (club: ClubData, rating: number): ClubData => ({ ...club, squad: club.squad.map(player => ({ ...player, rating })) });
const opponent = (strength: number): Opponent => ({ name: 'Northgate Wolves', strength, points: 0 });
const goalsOver = (club: ClubData, against: Opponent, matches = 120) =>
  Array.from({ length: matches }, (_, seed) => playUntil(club, against, seed + 1, []).score).reduce((total, score) => [total[0] + score[0], total[1] + score[1]] as [number, number], [0, 0] as [number, number]);

describe('Football rules', () => {
  it('fields eighteen players: two goalkeepers, six defenders, six midfielders and four forwards', () => {
    const { squad } = founded();
    expect(squad).toHaveLength(18);
    expect(squad.filter(player => player.position === 'goalkeeper')).toHaveLength(2);
    expect(squad.filter(player => player.position === 'forward')).toHaveLength(4);
  });

  it('has four formations of eleven with the goalkeeper', () => {
    expect(FORMATION_IDS).toEqual(['4-4-2', '4-3-3', '3-5-2', '5-3-2']);
    for (const formation of FORMATION_IDS) expect(1 + Object.values(FORMATIONS[formation]).reduce((a, b) => a + b, 0)).toBe(11);
  });

  it('picks the best eleven for each formation, a goalkeeper first', () => {
    const { squad } = founded();
    for (const formation of FORMATION_IDS) {
      const starters = autoStarters(squad, formation);
      expect(lineupIssue(squad, formation, starters)).toBeNull();
      expect(squad.find(player => player.id === starters[0])!.position).toBe('goalkeeper');
    }
  });

  it('refuses a lineup with the wrong lines, a field player in goal or an unknown player', () => {
    const { squad } = founded();
    const starters = autoStarters(squad, '4-4-2');
    expect(lineupIssue(squad, '4-3-3', starters)).not.toBeNull();
    expect(lineupIssue(squad, '4-4-2', [...starters.slice(1), starters[0]!])).toBe('a goalkeeper must come first');
    expect(lineupIssue(squad, '4-4-2', [...starters.slice(0, 10), 9999])).toBe('unknown player');
    expect(lineupIssue(squad, 'nope', starters)).toBe('unknown formation');
  });
});

describe('Football simulation', () => {
  it('plays the same Match from the same seed and decisions', () => {
    const club = founded();
    expect(playUntil(club, opponent(55), 7, [])).toEqual(playUntil(club, opponent(55), 7, []));
    expect(playUntil(club, opponent(55), 7, []).minute).toBe(FOOTBALL.minutes);
    expect(playUntil(club, opponent(55), 7, [], 30).minute).toBe(30);
  });

  it('is a prefix: playing to a minute gives the start of the full Match', () => {
    const club = founded();
    const full = playUntil(club, opponent(55), 9, []);
    const part = playUntil(club, opponent(55), 9, [], 45);
    expect(full.events.slice(0, part.events.length)).toEqual(part.events);
  });

  it('scores more for a stronger Squad, and concedes less', () => {
    const strong = goalsOver(rated(founded(), 85), opponent(50));
    const weak = goalsOver(rated(founded(), 35), opponent(50));
    expect(strong[0]).toBeGreaterThan(weak[0]);
    expect(strong[1]).toBeLessThan(weak[1]);
    expect(strong[0]).toBeGreaterThan(strong[1]);
  });

  it('gives a result by the score', () => {
    expect(resultOfScore([2, 1])).toBe('win');
    expect(resultOfScore([0, 0])).toBe('draw');
    expect(resultOfScore([0, 3])).toBe('loss');
  });

  it('changes tactic and makes at most three substitutions, bench players only', () => {
    const club = founded();
    const side = clubSide(club);
    const [leaving, other, third, fourth] = side.pitch.slice(1);
    const [first, second, third2, fourth2] = side.bench;
    const decisions: MatchDecision[] = [
      { minute: 10, kind: 'tactic', tactic: 'attacking' },
      { minute: 20, kind: 'substitute', out: leaving!.id, in: first!.id },
      { minute: 30, kind: 'substitute', out: other!.id, in: second!.id },
      { minute: 40, kind: 'substitute', out: third!.id, in: third2!.id },
      { minute: 50, kind: 'substitute', out: fourth!.id, in: fourth2!.id },
      { minute: 60, kind: 'substitute', out: side.pitch[0]!.id, in: 9999 },
    ];
    const state = playUntil(club, opponent(55), 3, decisions);
    expect(state.sides[0].tactic).toBe('attacking');
    expect(state.sides[0].substitutions).toBe(3);
    expect(state.events.filter(event => event.type === 'substitution')).toHaveLength(3);
    expect(state.events.filter(event => event.type === 'tactic')).toHaveLength(1);
  });

  it('weakens a side that lost a player to a red card', () => {
    const club = rated(founded(), 70);
    const reds = Array.from({ length: 400 }, (_, seed) => playUntil(club, opponent(70), seed + 1, []).sides[0].reds).reduce((a, b) => a + b, 0);
    expect(reds).toBeGreaterThan(0);
  });
});

describe('Football in the Championship', () => {
  const city = (): GameState => ({ ...newGame({ seed: 'football-city', now: 0 }), nextId: 100, urbs: 10_000, tutorial: null, adaptationUntil: 0, lastSeen: 0, buildings: [createBuilding(1, 'footballStadium', 60, 60, 0)] });
  const send = (state: GameState, command: Command) => {
    const result = dispatch(state, command, state.lastSeen);
    if (!result.ok) throw new Error(result.error.key);
    return result.state;
  };

  it('settles a Match with a score from the simulation, the same each time', () => {
    const state = send(city(), { type: 'FoundClub', buildingId: 1 });
    const first = state.buildings[0]!.club!.championship!.fixtures[0]!.at;
    const played = advance(state, first + 3 * 3_600_000).state.buildings[0]!.club!.championship!.fixtures[0]!;
    expect(played.score).toBeDefined();
    expect(played.result).toBe(resultOfScore(played.score!));
    const again = advance(state, first + 3 * 3_600_000).state.buildings[0]!.club!.championship!.fixtures[0]!;
    expect(again.score).toEqual(played.score);
    expect(fixtureSeedOf(state.buildings[0]!.club!, 0)).toBe(fixtureSeedOf(state.buildings[0]!.club!, 0));
  });

  it('sets a valid lineup through the command and refuses an invalid one', () => {
    const state = send(city(), { type: 'FoundClub', buildingId: 1 });
    const club = state.buildings[0]!.club!;
    const starters = autoStarters(club.squad, '4-3-3');
    const set = send(state, { type: 'SetLineup', buildingId: 1, formation: '4-3-3', starters, tactic: 'pressing' });
    expect(set.buildings[0]!.club!.lineup).toEqual({ formation: '4-3-3', starters, tactic: 'pressing' });
    const result = dispatch(state, { type: 'SetLineup', buildingId: 1, formation: '4-4-2', starters, tactic: 'balanced' }, 0);
    expect(result.ok).toBe(false);
  });

  it('records the decisions of a Match under way and replays them when it is settled', () => {
    const state = send(city(), { type: 'FoundClub', buildingId: 1 });
    const club = state.buildings[0]!.club!;
    const first = club.championship!.fixtures[0]!.at;
    const early = dispatch(state, { type: 'PlayMatch', buildingId: 1, decisions: [] }, 0);
    expect(early.ok ? null : early.error.key).toBe('error.matchNotStarted');
    const started = { ...state, lastSeen: first + 1 };
    const side = clubSide(club);
    const decisions: MatchDecision[] = [{ minute: 5, kind: 'tactic', tactic: 'attacking' }, { minute: 60, kind: 'substitute', out: side.pitch[3]!.id, in: side.bench[0]!.id }];
    const recorded = send(started, { type: 'PlayMatch', buildingId: 1, decisions });
    expect(recorded.buildings[0]!.club!.championship!.fixtures[0]!.decisions).toEqual(decisions);
    const settled = advance(recorded, first + 3 * 3_600_000).state.buildings[0]!.club!.championship!.fixtures[0]!;
    const expected = playUntil(club, club.championship!.opponents[0]!, fixtureSeedOf(club, 0), decisions).score;
    expect(settled.score).toEqual(expected);
  });
});
