import { describe, expect, it } from 'vitest';
import { groupKey, planPacks, type SizedFile } from './packFiles';

const MB = 1024 * 1024;
const folder = (name: string, count: number, size = MB): SizedFile[] =>
  Array.from({ length: count }, (_, index) => ({ path: `./models/${name}/m${String(index).padStart(3, '0')}.glb`, size }));
const packsOf = (files: SizedFile[]) => planPacks(files).map((pack) => pack.map((file) => file.path).join('|'));

describe('pack planning', () => {
  it('groups files by their folder under models and by codex', () => {
    expect(groupKey('./models/roads/a.glb')).toBe('./models/roads');
    expect(groupKey('./models/events/easter/a.glb')).toBe('./models/events');
    expect(groupKey('./codex/a.png')).toBe('./codex');
  });

  it('never mixes folders in one pack', () => {
    const packs = planPacks([...folder('roads', 30), ...folder('farm', 3)]);
    for (const pack of packs) expect(new Set(pack.map((file) => groupKey(file.path))).size).toBe(1);
  });

  it('keeps every pack under the size cap and every file in exactly one pack', () => {
    const files = [...folder('buildings', 200, 700 * 1024), { path: './models/buildings/huge.glb', size: 9 * MB }];
    const packs = planPacks(files);
    for (const pack of packs) if (pack.length > 1) expect(pack.reduce((sum, file) => sum + file.size, 0)).toBeLessThanOrEqual(8 * MB);
    expect(packs.flat().map((file) => file.path).sort()).toEqual(files.map((file) => file.path).sort());
  });

  it('does not depend on the order of the input', () => {
    const files = folder('roads', 40);
    expect(packsOf([...files].reverse())).toEqual(packsOf(files));
  });

  it('changes only one pack of the folder when a file is added', () => {
    const files = folder('buildings', 200);
    const before = packsOf(files);
    const after = packsOf([...files, { path: './models/buildings/new.glb', size: MB }]);
    expect(after.filter((pack) => !before.includes(pack))).toHaveLength(1);
  });

  it('leaves the other folders untouched when a file is added', () => {
    const others = [...folder('roads', 20), ...folder('farm', 5)];
    const before = packsOf([...others, ...folder('buildings', 50)]);
    const after = packsOf([...others, ...folder('buildings', 51)]);
    for (const pack of before.filter((entry) => !entry.includes('/buildings/'))) expect(after).toContain(pack);
  });
});
