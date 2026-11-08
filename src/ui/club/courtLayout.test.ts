import { describe, expect, it } from 'vitest';
import { BASKETBALL_RULES, createClub, playBasketball, type Opponent } from '../../core';
import { COURT, attackingSide, ballSpot, courtPlayers } from './courtLayout';

const club = createClub(BASKETBALL_RULES, 'Harbour Hoops', 'court');
const opponent: Opponent = { name: 'Northgate Wolves', strength: 55, points: 0 };
const at = (minute: number) => playBasketball(club, opponent, 5, [], minute);

describe('Court layout', () => {
  it('puts ten players inside the court, five a side', () => {
    for (const minute of [0, 1, 10, 30, 48]) {
      const players = courtPlayers(at(minute), 5);
      expect(players).toHaveLength(10);
      expect(players.filter(player => player.side === 0)).toHaveLength(5);
      for (const player of players) {
        expect(player.x).toBeGreaterThanOrEqual(0);
        expect(player.x).toBeLessThanOrEqual(COURT.width);
        expect(player.y).toBeGreaterThanOrEqual(0);
        expect(player.y).toBeLessThanOrEqual(COURT.height);
      }
    }
  });

  it('moves the players from one minute to the next, the same way each time', () => {
    const first = courtPlayers(at(10), 5);
    const second = courtPlayers(at(11), 5);
    expect(second.some((player, index) => player.x !== first[index]!.x || player.y !== first[index]!.y)).toBe(true);
    expect(courtPlayers(at(11), 5)).toEqual(second);
  });

  it('pushes the side with the ball up the court', () => {
    const state = at(20);
    const attacker = attackingSide(state, 5);
    const average = (side: 0 | 1) => courtPlayers(state, 5).filter(player => player.side === side).reduce((total, player) => total + player.x, 0) / 5;
    expect(attacker === 0 ? average(0) : COURT.width - average(1)).toBeGreaterThan(attacker === 0 ? COURT.width - average(1) : average(0));
  });

  it('puts the ball at the hoop on a basket', () => {
    const state = Array.from({ length: 48 }, (_, minute) => at(minute + 1)).find(candidate => candidate.events.some(event => event.minute === candidate.minute && event.type !== 'tactic' && event.type !== 'substitution'));
    expect(state).toBeDefined();
    const ball = ballSpot(state!, 5);
    expect(Math.abs(ball.x - COURT.width / 2)).toBeGreaterThan(COURT.width / 2 - 8);
  });
});
