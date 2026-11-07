import { describe, expect, it } from 'vitest';
import { groupKey, planPacks } from './packFiles';

describe('pack planning', () => {
  it('groups files by their folder under models and by codex', () => {
    expect(groupKey('./models/roads/a.glb')).toBe('./models/roads');
    expect(groupKey('./models/events/easter/a.glb')).toBe('./models/events');
    expect(groupKey('./codex/a.png')).toBe('./codex');
  });

  it('never mixes folders in one pack and splits a folder over the size cap', () => {
    const files = [
      { path: './models/roads/b.glb', size: 6 },
      { path: './models/roads/a.glb', size: 6 },
      { path: './models/roads/c.glb', size: 3 },
      { path: './models/farm/a.glb', size: 1 },
    ];
    const packs = planPacks(files, 10).map((pack) => pack.map((file) => file.path));
    expect(packs).toEqual([
      ['./models/farm/a.glb'],
      ['./models/roads/a.glb'],
      ['./models/roads/b.glb', './models/roads/c.glb'],
    ]);
  });
});
