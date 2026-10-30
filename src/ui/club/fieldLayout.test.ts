import { describe, expect, it } from 'vitest';
import { BASEBALL_RULES, createClub, playBaseball } from '../../core';
import { BASES, FIELD, HOME, MOUND, ballSpot, fieldersOf, isPlay, replayUpTo, runnerSpots, type Play } from './fieldLayout';

const club = createClub(BASEBALL_RULES, 'Harbour Herons', 'field');
const opponent = { name: 'Northgate Wolves', strength: 55, points: 0 };
const state = playBaseball(club, opponent, 4, []);
const plays = state.events.filter(isPlay);
const inside = (spot: { x: number; y: number }) => spot.x >= 0 && spot.x <= FIELD && spot.y >= 0 && spot.y <= FIELD;
const play = (type: Play['type']): Play => plays.find(candidate => candidate.type === type) ?? ({ type, inning: 1, half: 0, side: 0, player: 'A', runs: 0, outs: 0, bases: [false, false, false] } as Play);

describe('replay of an inning', () => {
  it('tells nothing before the first play', () => {
    const replay = replayUpTo(state, 0);
    expect(replay.events.filter(isPlay)).toEqual([]);
    expect(replay.score).toEqual([0, 0]);
    expect(replay.inning).toBe(plays[0]!.inning);
  });

  it('counts only the runs of the plays shown', () => {
    const scoring = plays.findIndex(candidate => candidate.runs > 0);
    const before = replayUpTo(state, scoring);
    const after = replayUpTo(state, scoring + 1);
    expect(after.score[plays[scoring]!.side]).toBe(before.score[plays[scoring]!.side] + plays[scoring]!.runs);
    expect(after.events.filter(isPlay)).toHaveLength(scoring + 1);
  });

  it('ends on the real state once every play is shown', () => {
    expect(replayUpTo(state, plays.length)).toBe(state);
  });

  it('keeps the decisions in the feed whatever the plays shown', () => {
    const change = { inning: 1, half: 0, side: 0, type: 'approach', approach: 'power' } as const;
    expect(replayUpTo({ ...state, events: [change, ...state.events] }, 0).events).toEqual([change]);
  });
});

describe('field', () => {
  it('has the bases in a diamond around the mound, home plate at the bottom', () => {
    expect(BASES).toHaveLength(3);
    expect(BASES[1]!.y).toBeLessThan(BASES[0]!.y);
    expect(BASES[0]!.x).toBeGreaterThan(HOME.x);
    expect(BASES[2]!.x).toBeLessThan(HOME.x);
    expect(MOUND.y).toBeGreaterThan(BASES[1]!.y);
    expect(MOUND.y).toBeLessThan(HOME.y);
  });

  it('puts the runners on the bases that are taken', () => {
    expect(runnerSpots([false, false, false])).toEqual([]);
    expect(runnerSpots([true, false, true])).toEqual([BASES[0], BASES[2]]);
  });
});

describe('ball', () => {
  it('starts on the mound, ends a strikeout in the catcher\'s glove and a home run over the fence', () => {
    expect(ballSpot(undefined, 1, 0)).toEqual(MOUND);
    expect(ballSpot(play('strikeout'), 1, 3).y).toBeGreaterThan(HOME.y);
    expect(ballSpot(play('homer'), 1, 3).y).toBeLessThan(12);
  });

  it('stays on the field and lands somewhere else from one play to the next', () => {
    const spots = plays.map((candidate, index) => ballSpot(candidate, 4, index));
    expect(spots.every(inside)).toBe(true);
    expect(new Set(spots.filter((_, index) => plays[index]!.type === 'single').map(spot => spot.x.toFixed(1))).size).toBeGreaterThan(1);
  });

  it('is the same for the same play and seed', () => {
    expect(ballSpot(play('single'), 4, 7)).toEqual(ballSpot(play('single'), 4, 7));
  });
});

describe('fielders', () => {
  const defence = state.sides[0];

  it('puts nine on the field, none off it, the pitcher on the mound and the catcher behind the plate', () => {
    const fielders = fieldersOf(defence, MOUND, 4, 0);
    expect(fielders).toHaveLength(9);
    expect(fielders.every(inside)).toBe(true);
    expect(fielders.filter(player => player.role === 'infield')).toHaveLength(4);
    expect(fielders.filter(player => player.role === 'outfield')).toHaveLength(3);
    expect(fielders.find(player => player.role === 'catcher')!.y).toBeGreaterThan(HOME.y);
    expect(Math.hypot(fielders.find(player => player.role === 'pitcher')!.x - MOUND.x, fielders.find(player => player.role === 'pitcher')!.y - MOUND.y)).toBeLessThan(6);
  });

  it('fields an opposing club, all of whose players are given the same position', () => {
    expect(fieldersOf(state.sides[1], MOUND, 4, 0)).toHaveLength(9);
  });

  it('moves the fielders from one play to the next, and toward a ball hit their way', () => {
    const before = fieldersOf(defence, MOUND, 4, 5);
    const after = fieldersOf(defence, MOUND, 4, 6);
    expect(before.some((player, index) => Math.abs(player.x - after[index]!.x) > 0.5)).toBe(true);
    const deep = { x: 20, y: 25 };
    const left = fieldersOf(defence, deep, 4, 6).find(player => player.role === 'outfield' && player.number === 7)!;
    const rest = fieldersOf(defence, { x: 20, y: 28 }, 4, 6).find(player => player.role === 'outfield' && player.number === 7)!;
    expect(Math.hypot(left.x - deep.x, left.y - deep.y)).toBeLessThanOrEqual(Math.hypot(rest.x - deep.x, rest.y - deep.y) + 6);
  });
});
