import { afterEach, describe, expect, it, vi } from 'vitest';
import { withTimeout } from './withTimeout';

afterEach(() => vi.useRealTimers());

describe('withTimeout', () => {
  it('returns the value when the work finishes in time', async () => {
    await expect(withTimeout(Promise.resolve('done'), 1000)).resolves.toBe('done');
  });

  it('gives up with null when the work never finishes', async () => {
    vi.useFakeTimers();
    const result = withTimeout(new Promise<string>(() => {}), 1000);
    vi.advanceTimersByTime(1000);
    await expect(result).resolves.toBeNull();
  });

  it('passes a failure on', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 1000)).rejects.toThrow('boom');
  });
});
