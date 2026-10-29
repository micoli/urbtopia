import { describe, expect, it } from 'vitest';
import { advance, createBuilding, createClub, dispatch, fixtureSeedOf, newGame, type ClubData, type Command, type GameState, type MatchDecision, type Opponent } from '../../index';
import { BASEBALL, BASEBALL_RULES, autoStarters, clubSide, lineupIssue, playUntil } from './baseball';

const founded = (seed = 'bb'): ClubData => createClub(BASEBALL_RULES, 'Harbour Herons', seed);
const rated = (club: ClubData, rating: number): ClubData => ({ ...club, squad: club.squad.map(player => ({ ...player, rating })) });
const opponent = (strength: number): Opponent => ({ name: 'Northgate Wolves', strength, points: 0 });
const runsOver = (club: ClubData, against: Opponent, matches = 120) =>
  Array.from({ length: matches }, (_, seed) => playUntil(club, against, seed + 1, []).score).reduce((total, score) => [total[0] + score[0], total[1] + score[1]] as [number, number], [0, 0] as [number, number]);

describe('Baseball rules', () => {
  it('has twenty players: six pitchers, two catchers, six infielders and six outfielders, and no draw', () => {
    const { squad } = founded();
    expect(squad).toHaveLength(20);
    expect(squad.filter(player => player.position === 'pitcher')).toHaveLength(6);
    expect(BASEBALL_RULES.draws).toBe(false);
  });

  it('picks a starting pitcher and nine hitters with a catcher, the best first', () => {
    const { squad } = founded();
    const starters = autoStarters(squad);
    expect(starters).toHaveLength(10);
    expect(lineupIssue(squad, starters)).toBeNull();
    expect(squad.find(player => player.id === starters[0])!.position).toBe('pitcher');
    const ratings = starters.slice(1).map(id => squad.find(player => player.id === id)!.rating);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });

  it('refuses a lineup with no catcher, a pitcher at bat, a hitter on the mound or a missing player', () => {
    const { squad } = founded();
    const starters = autoStarters(squad);
    const catcher = squad.find(player => starters.includes(player.id) && player.position === 'catcher')!;
    const otherPitcher = squad.find(player => player.position === 'pitcher' && !starters.includes(player.id))!;
    const spare = squad.find(player => !starters.includes(player.id) && player.position === 'infielder')!;
    expect(lineupIssue(squad, starters.map(id => (id === catcher.id ? spare.id : id)))).toBe('a catcher is needed');
    expect(lineupIssue(squad, [...starters.slice(0, 9), otherPitcher.id])).toBe('a pitcher cannot bat');
    expect(lineupIssue(squad, [starters[1]!, starters[0]!, ...starters.slice(2)])).toBe('a pitcher must come first');
    expect(lineupIssue(squad, [...starters.slice(0, 9), 9999])).toBe('unknown player');
  });
});

describe('Baseball simulation', () => {
  it('plays the same Match from the same seed and decisions, for nine innings or more, never level', () => {
    const club = founded();
    const state = playUntil(club, opponent(55), 5, []);
    expect(state).toEqual(playUntil(club, opponent(55), 5, []));
    expect(state.inning).toBeGreaterThanOrEqual(BASEBALL.innings - 1);
    expect(state.score[0]).not.toBe(state.score[1]);
    expect(state.over).toBe(true);
  });

  it('plays to an inning and is a prefix of the full Match', () => {
    const club = founded();
    const full = playUntil(club, opponent(55), 8, []);
    const part = playUntil(club, opponent(55), 8, [], 3);
    expect(part.inning).toBe(3);
    expect(full.events.slice(0, part.events.length)).toEqual(part.events);
  });

  it('scores more runs for a stronger Squad, and concedes fewer', () => {
    const strong = runsOver(rated(founded(), 85), opponent(50));
    const weak = runsOver(rated(founded(), 35), opponent(50));
    expect(strong[0]).toBeGreaterThan(weak[0]);
    expect(strong[1]).toBeLessThan(weak[1]);
  });

  it('changes the batting approach and the pitcher, at most three times, from the bullpen only', () => {
    const club = founded();
    const side = clubSide(club);
    const [first, second, third, fourth] = side.bullpen;
    const decisions: MatchDecision[] = [
      { minute: 1, kind: 'tactic', tactic: 'power' },
      { minute: 2, kind: 'substitute', out: side.pitcher.id, in: first!.id },
      { minute: 3, kind: 'substitute', out: first!.id, in: second!.id },
      { minute: 4, kind: 'substitute', out: second!.id, in: third!.id },
      { minute: 5, kind: 'substitute', out: third!.id, in: fourth!.id },
      { minute: 6, kind: 'substitute', out: fourth!.id, in: 9999 },
    ];
    const state = playUntil(club, opponent(55), 3, decisions);
    expect(state.sides[0].approach).toBe('power');
    expect(state.sides[0].changes).toBe(3);
    expect(state.events.filter(event => event.type === 'change')).toHaveLength(3);
  });

  it('hits more home runs with the power approach', () => {
    const club = rated(founded(), 60);
    const homers = (approach: string) => Array.from({ length: 80 }, (_, seed) => playUntil({ ...club, lineup: { formation: 'standard', starters: autoStarters(club.squad), tactic: approach } }, opponent(60), seed + 1, []).events.filter(event => event.type === 'homer' && event.side === 0).length).reduce((a, b) => a + b, 0);
    expect(homers('power')).toBeGreaterThan(homers('contact'));
  });

  it('wears the pitcher out, so a long outing concedes more than a fresh one', () => {
    const club = rated(founded(), 60);
    const early = playUntil(club, opponent(60), 4, [], 3);
    const late = playUntil(club, opponent(60), 4, []);
    expect(late.sides[0].pitches).toBeGreaterThan(early.sides[0].pitches);
  });
});

describe('Baseball in the Championship', () => {
  const city = (): GameState => ({ ...newGame({ seed: 'baseball-city', now: 0 }), nextId: 100, urbs: 10_000, tutorial: null, adaptationUntil: 0, lastSeen: 0, buildings: [createBuilding(1, 'baseballField', 60, 60, 0)] });
  const send = (state: GameState, command: Command) => {
    const result = dispatch(state, command, state.lastSeen);
    if (!result.ok) throw new Error(result.error.key);
    return result.state;
  };

  it('settles each Match with a win or a loss and the score of the simulation', () => {
    const state = send(city(), { type: 'FoundClub', buildingId: 1 });
    const club = state.buildings[0]!.club!;
    const first = club.championship!.fixtures[0]!.at;
    const played = advance(state, first + 3 * 3_600_000).state.buildings[0]!.club!.championship!.fixtures[0]!;
    expect(['win', 'loss']).toContain(played.result);
    expect(played.score).toEqual(playUntil(club, club.championship!.opponents[0]!, fixtureSeedOf(club, 0), []).score);
  });

  it('sets a valid lineup through the same command as football', () => {
    const state = send(city(), { type: 'FoundClub', buildingId: 1 });
    const club = state.buildings[0]!.club!;
    const starters = autoStarters(club.squad);
    const set = send(state, { type: 'SetLineup', buildingId: 1, formation: 'standard', starters, tactic: 'power' });
    expect(set.buildings[0]!.club!.lineup!.starters).toEqual(starters);
    expect(dispatch(state, { type: 'SetLineup', buildingId: 1, formation: 'standard', starters: starters.slice(1), tactic: 'power' }, 0).ok).toBe(false);
  });
});
