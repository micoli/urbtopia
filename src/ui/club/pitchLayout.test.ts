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

  it('draws the players toward the ball', () => {
    const state = playUntil(club, opponent, 3, [], 30);
    const rest = formationSpots('4-4-2')[10]!;
    const forward = pitchPlayers(state, '4-4-2', 3).find(player => player.side === 0 && player.number === 11)!;
    const ball = ballSpot(state, 3);
    expect(Math.hypot(forward.x - ball.x, forward.y - ball.y)).toBeLessThan(Math.hypot(rest.x - ball.x, rest.y - ball.y));
  });
});
