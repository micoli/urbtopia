import { describe, expect, it, vi } from 'vitest';
import { createBuilding, energyStats, venuePower, homeSanction, isVenuePowered, needsContext, newGame, type GameState } from '../index';

vi.mock('../politics/ordinanceEffects', async importOriginal => ({ ...(await importOriginal<object>()), energySavingOf: () => 0.0586 }));

const stateWith = (...types: string[]): GameState => {
  const base = newGame({ seed: 'venue-power', now: 1_700_000_000_000 });
  const buildings = types.map((type, index) => ({ ...createBuilding(base.nextId + index, type as never, 60 + index * 3, 50, 0), tier: type === 'home' ? index + 1 : 1 }));
  return { ...base, adaptationUntil: 0, nextId: base.nextId + buildings.length, buildings: [...base.buildings, ...buildings] };
};

describe('power under an energy saving', () => {
  it('keeps a Venue open when it gets all of its reduced need', () => {
    const state = stateWith('arcade', 'coalPlant');
    const arcade = state.buildings.find(b => b.type === 'arcade')!;
    expect(energyStats(state).supplied.get(arcade.id)).toBeCloseTo(venuePower(arcade) * (1 - 0.0586), 9);
    expect(isVenuePowered(state, arcade)).toBe(true);
  });

  it('does not sanction a Home that gets all of its need', () => {
    const state: GameState = { ...stateWith('home', 'home', 'home', 'home', 'coalPlant'), difficulty: 'easy' };
    const context = needsContext(state);
    for (const home of state.buildings.filter(b => b.type === 'home')) expect(homeSanction(state, home, context).factor).not.toBe('electricity');
  });
});
