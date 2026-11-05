import { describe, expect, it } from 'vitest';
import { pickDotStore } from './pickDotStore';

describe('pick dot', () => {
  it('shows the picked point, blinks again on the same point, and goes away', () => {
    pickDotStore.getState().show(420, 320);
    const first = pickDotStore.getState().dot!;
    expect(first).toMatchObject({ x: 420, y: 320 });
    pickDotStore.getState().show(420, 320);
    expect(pickDotStore.getState().dot!.id).toBeGreaterThan(first.id);
    pickDotStore.getState().clear();
    expect(pickDotStore.getState().dot).toBeNull();
  });
});
