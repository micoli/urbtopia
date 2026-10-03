import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reloadApp } from './reloadApp';

describe('reloadApp', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reloads once the update check is done', async () => {
    const reload = vi.fn();
    await reloadApp({ checkForUpdate: () => Promise.resolve(), reload });
    expect(reload).toHaveBeenCalledOnce();
  });

  it('reloads anyway when the update check fails', async () => {
    const reload = vi.fn();
    await reloadApp({ checkForUpdate: () => Promise.reject(new Error('offline')), reload });
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not wait forever for an update check that hangs', async () => {
    const reload = vi.fn();
    const done = reloadApp({ checkForUpdate: () => new Promise(() => {}), reload });
    expect(reload).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3000);
    await done;
    expect(reload).toHaveBeenCalledOnce();
  });
});
