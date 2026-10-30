import { describe, expect, it } from 'vitest';
import { FORMATION_IDS, FOOTBALL_RULES, createClub, playUntil, type MatchEvent } from '../../core';
import { PITCH, ballSpot, formationSpots, pitchPlayers } from './pitchLayout';

const club = createClub(FOOTBALL_RULES, 'Harbour Herons', 'pitch');
const opponent = { name: 'Northgate Wolves', strength: 55, points: 0 };
const inside = (spot: { x: number; y: number }) => spot.x >= 0 && spot.x <= PITCH.width && spot.y >= 0 && spot.y <= PITCH.height;

describe('formation spots', () => {
  it('place eleven players on the left half for every formation, the goalkeeper nearest the goal', () => {
    for (const formation of FORMATION_IDS) {
      const spots = formationSpots(formation);
      expect(spots).toHaveLength(11);
      expect(spots.every(inside)).toBe(true);
      expect(spots.every(spot => spot.x < PITCH.width / 2 + 25)).toBe(true);
      expect(Math.min(...spots.map(spot => spot.x))).toBe(spots[0]!.x);
    }
  });

  it('keep the number of defenders, midfielders and forwards of the formation', () => {
    const xs = formationSpots('3-5-2').map(spot => spot.x);
    expect([3, 5, 2].every((count, line) => xs.filter(x => x === [24, 48, 70][line]).length === count)).toBe(true);
  });
});

describe('ball', () => {
  const at = (minute: number, events: MatchEvent[]) => ({ minute, events });

  it('starts at the centre and stays on the pitch', () => {
    expect(ballSpot(at(0, []), 1)).toEqual({ x: PITCH.width / 2, y: PITCH.height / 2 });
    for (let minute = 1; minute <= 90; minute++) expect(inside(ballSpot(at(minute, []), 7))).toBe(true);
  });

  it('is the same for the same minute and seed', () => {
    expect(ballSpot(at(33, []), 4)).toEqual(ballSpot(at(33, []), 4));
    expect(ballSpot(at(33, []), 4)).not.toEqual(ballSpot(at(34, []), 4));
  });

  it('is in the goal of the side that scored in that minute, and in its box right after a chance', () => {
    const goal: MatchEvent = { minute: 40, side: 0, type: 'goal', player: 'A' };
    expect(ballSpot(at(40, [goal]), 1).x).toBeGreaterThan(PITCH.width - 6);
    expect(ballSpot(at(41, [goal]), 1).x).toBeGreaterThan(PITCH.width * 0.75);
    const awayChance: MatchEvent = { minute: 20, side: 1, type: 'chance', player: 'B' };
    expect(ballSpot(at(21, [awayChance]), 1).x).toBeLessThan(PITCH.width * 0.25);
    expect(ballSpot(at(24, [awayChance]), 1).x).not.toBeLessThan(0);
  });
});

describe('players on the pitch', () => {
  it('shows eleven of each side, all on the pitch, the visitors on the right', () => {
    const state = playUntil(club, opponent, 3, [], 30);
    const players = pitchPlayers(state, '4-4-2', 3);
    expect(players.filter(player => player.side === 0)).toHaveLength(11);
    expect(players.filter(player => player.side === 1)).toHaveLength(11);
    expect(players.every(inside)).toBe(true);
    expect(players.find(player => player.side === 1 && player.number === 1)!.x).toBeGreaterThan(PITCH.width * 0.9);
  });

  it('draws the players toward the ball on the whole, though no two minutes look alike', () => {
    const closer = [];
    for (let minute = 1; minute <= 90; minute++) {
      const state = playUntil(club, opponent, 3, [], minute);
      const ball = ballSpot(state, 3);
      const forwards = pitchPlayers(state, '4-4-2', 3).filter(player => player.side === 0 && player.number >= 10);
      const rest = formationSpots('4-4-2').slice(9);
      closer.push(forwards.reduce((sum, player, index) => sum + Math.hypot(rest[index]!.x - ball.x, rest[index]!.y - ball.y) - Math.hypot(player.x - ball.x, player.y - ball.y), 0));
    }
    expect(closer.filter(gain => gain > 0).length).toBeGreaterThan(55);
    expect(closer.some(gain => gain < 0)).toBe(true);
  });

  it('moves each player on his own: not by the same step, not in the same direction', () => {
    const at = (minute: number) => pitchPlayers(playUntil(club, opponent, 3, [], minute), '4-4-2', 3).filter(player => player.side === 0);
    let opposed = 0;
    for (let minute = 40; minute < 60; minute++) {
      const [before, after] = [at(minute), at(minute + 1)];
      const steps = after.map((player, index) => ({ dx: player.x - before[index]!.x, dy: player.y - before[index]!.y }));
      expect(new Set(steps.map(step => step.dx.toFixed(1))).size).toBeGreaterThan(8);
      if (steps.some(step => step.dx > 0.3) && steps.some(step => step.dx < -0.3) && steps.some(step => step.dy > 0.3) && steps.some(step => step.dy < -0.3)) opposed += 1;
    }
    expect(opposed).toBeGreaterThan(12);
  });

  it('sends a different player on a run each minute, and the same ones on a replay', () => {
    const runners = (minute: number) => pitchPlayers(playUntil(club, opponent, 3, [], minute), '4-4-2', 3).filter(player => player.side === 0).map(player => `${player.x.toFixed(2)},${player.y.toFixed(2)}`);
    expect(runners(40)).toEqual(runners(40));
    expect(runners(40)).not.toEqual(runners(41));
  });

  it('keeps the players at their own side of the pitch on the whole', () => {
    const state = playUntil(club, opponent, 3, [], 60);
    const away = pitchPlayers(state, '4-4-2', 3).filter(player => player.side === 1 && player.number > 1);
    expect(away.reduce((sum, player) => sum + player.x, 0) / away.length).toBeGreaterThan(PITCH.width / 2);
  });
});
