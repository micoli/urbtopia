import { describe, expect, it } from 'vitest';
import { isSimulationRequested } from './simulationFlag';

describe('isSimulationRequested', () => {
  it('is on when the simulation parameter is present', () => {
    expect(isSimulationRequested('?simulation')).toBe(true);
    expect(isSimulationRequested('?fps&simulation=1')).toBe(true);
  });

  it('is off otherwise', () => {
    expect(isSimulationRequested('')).toBe(false);
    expect(isSimulationRequested('?fps')).toBe(false);
  });
});
