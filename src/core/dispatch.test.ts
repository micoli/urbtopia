import { describe, expect, it } from 'vitest';
import { dispatch, newGame } from './index';

const NOW = 1_700_000_000_000;

describe('dispatch', () => {
  it('returns a typed error with a message key for an unknown command, without throwing', () => {
    const state = newGame({ seed: 'amber-fox-4821', now: NOW });
    const result = dispatch(state, { type: 'DoesNotExist' }, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.key).toBe('error.unknownCommand');
    expect(result.state).toEqual(state);
  });

  it('does not mutate the input state', () => {
    const state = newGame({ seed: 'amber-fox-4821', now: NOW });
    const snapshot = structuredClone(state);
    dispatch(state, { type: 'DoesNotExist' }, NOW + 1000);
    expect(state).toEqual(snapshot);
  });
});
