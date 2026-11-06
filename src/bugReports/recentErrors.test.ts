import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RECENT_ERRORS_KEPT } from './limits';
import { clearRecentErrors, describeError, installErrorRecorder, recentErrors, recordError } from './recentErrors';

beforeEach(clearRecentErrors);

describe('recentErrors', () => {
  it('keeps only the latest ones', () => {
    for (let index = 0; index < RECENT_ERRORS_KEPT + 3; index++) recordError(`error ${index}`);
    const kept = recentErrors();
    expect(kept).toHaveLength(RECENT_ERRORS_KEPT);
    expect(kept[0]).toBe('error 3');
  });

  it('cuts a long message', () => {
    recordError('x'.repeat(1000));
    expect(recentErrors()[0]).toHaveLength(300);
  });

  it('describes errors, strings and other values', () => {
    expect(describeError(new TypeError('bad'))).toBe('TypeError: bad');
    expect(describeError('plain')).toBe('plain');
    expect(describeError({ a: 1 })).toBe('{"a":1}');
  });
});

describe('installErrorRecorder', () => {
  it('records console errors, still forwards them, and restores on stop', () => {
    const forwarded = vi.fn();
    const sink = { error: forwarded } as unknown as Pick<Console, 'error'>;
    const listeners = new Map<string, (event: unknown) => void>();
    const target = { addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener) } as unknown as Pick<Window, 'addEventListener'>;
    const stop = installErrorRecorder(target, sink);
    sink.error('boom', new Error('inner'));
    listeners.get('unhandledrejection')?.({ reason: new Error('late') });
    expect(forwarded).toHaveBeenCalledOnce();
    expect(recentErrors()).toEqual(['boom Error: inner', 'Error: late']);
    stop();
    expect(sink.error).toBe(forwarded);
  });
});
