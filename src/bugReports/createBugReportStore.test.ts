import { describe, expect, it, vi } from 'vitest';
import { createBugReportStore } from './createBugReportStore';
import type { ReportSnapshot } from './liveReportSnapshot';

const snapshot: ReportSnapshot = { map: 'm', screen: 's', pose: null, cityText: '{}', cityId: 'c', citySeed: 'seed' };

describe('bug report store', () => {
  it('closes the windows and waits two frames before the capture', async () => {
    const order: string[] = [];
    const store = createBugReportStore({
      closeWindows: () => order.push('close'),
      nextFrame: async () => void order.push('frame'),
      capture: async () => (order.push('capture'), snapshot),
    });
    await store.getState().openForm();
    expect(order).toEqual(['close', 'frame', 'frame', 'capture']);
    expect(store.getState()).toMatchObject({ open: true, opening: false, snapshot });
  });

  it('ignores a second open while the form is opening', async () => {
    const capture = vi.fn(async () => snapshot);
    const store = createBugReportStore({ closeWindows: () => {}, nextFrame: async () => {}, capture });
    await Promise.all([store.getState().openForm(), store.getState().openForm()]);
    expect(capture).toHaveBeenCalledOnce();
  });

  it('stays closed when the capture fails, and forgets the snapshot on close', async () => {
    const failing = createBugReportStore({ closeWindows: () => {}, nextFrame: async () => {}, capture: async () => Promise.reject(new Error('x')) });
    await failing.getState().openForm();
    expect(failing.getState()).toMatchObject({ open: false, opening: false });
    const working = createBugReportStore({ closeWindows: () => {}, nextFrame: async () => {}, capture: async () => snapshot });
    await working.getState().openForm();
    working.getState().closeForm();
    expect(working.getState()).toMatchObject({ open: false, snapshot: null });
  });
});
