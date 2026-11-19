import { beforeEach, describe, expect, it } from 'vitest';
import { districtStore } from './districtStore';

describe('the District plan screen store', () => {
  beforeEach(() => districtStore.getState().close());

  it('opens on an office with no cell and no turn', () => {
    districtStore.getState().open(7);
    expect(districtStore.getState()).toMatchObject({ officeId: 7, cell: null, rotation: 0 });
  });

  it('turns the Hex a step at a time and comes back after six', () => {
    districtStore.getState().open(7);
    for (let step = 1; step <= 6; step++) {
      districtStore.getState().rotate();
      expect(districtStore.getState().rotation).toBe(step % 6);
    }
  });

  it('turns the Hex back a step at a time, from none to the last step and round again', () => {
    districtStore.getState().open(7);
    districtStore.getState().rotateBack();
    expect(districtStore.getState().rotation).toBe(5);
    districtStore.getState().rotateBack();
    expect(districtStore.getState().rotation).toBe(4);
    districtStore.getState().rotate();
    districtStore.getState().rotate();
    expect(districtStore.getState().rotation).toBe(0);
  });

  it('forgets the draft once a Hex is placed, but keeps the office open', () => {
    districtStore.getState().open(7);
    districtStore.getState().selectCell({ q: 1, r: 0 });
    districtStore.getState().rotate();
    districtStore.getState().clearDraft();
    expect(districtStore.getState()).toMatchObject({ officeId: 7, cell: null, rotation: 0 });
  });

  it('closes on nothing', () => {
    districtStore.getState().open(7);
    districtStore.getState().close();
    expect(districtStore.getState().officeId).toBeNull();
  });
});
