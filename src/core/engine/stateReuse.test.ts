import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { energyStats } from '../environment/energy';
import { transitNetwork } from '../transit/transport';
import { congestionStats } from '../traffic/congestion';
import { advance } from './advance';
import { parseEnvelope } from '../../persistence/envelope';
import type { GameState } from './state';

const STEP_MS = 1000;
const STEPS = 25;

const mapsAsEntries = (_key: string, value: unknown) => (value instanceof Map ? [...value] : value instanceof Set ? [...value] : value);
const plain = (value: unknown) => JSON.stringify(value, mapsAsEntries);

function loadCity(): GameState {
  const parsed = parseEnvelope(readFileSync('saves/evolved-city.json', 'utf8'));
  if (!parsed.ok) throw new Error('evolved city does not load');
  return parsed.state;
}

describe('Reusing the power, the transit network and the congestion across replay steps', () => {
  it('gives what a computation from scratch gives at every step', () => {
    let state = loadCity();
    let now = state.lastSeen;
    for (let step = 0; step < STEPS; step++) {
      now += STEP_MS;
      state = advance(state, now).state;
      const fresh = structuredClone(state);
      expect(plain(energyStats(state))).toBe(plain(energyStats(fresh)));
      expect(plain(transitNetwork(state))).toBe(plain(transitNetwork(fresh)));
      expect(plain(congestionStats(state))).toBe(plain(congestionStats(fresh)));
    }
  });
});
