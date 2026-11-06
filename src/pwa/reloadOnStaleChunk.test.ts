import { describe, expect, it, vi } from 'vitest';
import { isChunkLoadError, reloadOnceForStaleChunk } from './reloadOnStaleChunk';

function deps(lastReload: string | null, now: number) {
  return { now: () => now, read: () => lastReload, write: vi.fn(), reload: vi.fn() };
}

describe('reloadOnceForStaleChunk', () => {
  it('reloads and remembers the time when it never reloaded', () => {
    const d = deps(null, 1_000_000);
    expect(reloadOnceForStaleChunk(d)).toBe(true);
    expect(d.write).toHaveBeenCalledWith('1000000');
    expect(d.reload).toHaveBeenCalledOnce();
  });

  it('does not reload again within the cooldown', () => {
    const d = deps('1000000', 1_030_000);
    expect(reloadOnceForStaleChunk(d)).toBe(false);
    expect(d.reload).not.toHaveBeenCalled();
  });

  it('reloads again once the cooldown has passed', () => {
    const d = deps('1000000', 1_100_000);
    expect(reloadOnceForStaleChunk(d)).toBe(true);
    expect(d.reload).toHaveBeenCalledOnce();
  });
});

describe('isChunkLoadError', () => {
  it('recognises the chunk load failures of the main browsers', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/a.js'))).toBe(true);
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isChunkLoadError(new Error('boom'))).toBe(false);
    expect(isChunkLoadError('Failed to fetch')).toBe(false);
  });
});
