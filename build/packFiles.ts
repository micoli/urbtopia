import { createHash } from 'node:crypto';

export const PACK_SIZE_CAP = 8 * 1024 * 1024;

export type SizedFile = { path: string; size: number };
export type VersionedFile = [version: string, pack: number, offset: number, size: number];

// Files of one folder travel together: './models/roads/a.glb' belongs to './models/roads', './codex/a.png' to './codex'.
export function groupKey(path: string): string {
  const parts = path.split('/');
  return parts.slice(0, parts.length > 3 ? 3 : 2).join('/');
}

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const hashOf = (path: string) => createHash('md5').update(path).digest().readUInt32BE(0);
const nextPowerOfTwo = (value: number) => 2 ** Math.ceil(Math.log2(Math.max(value, 1)));

// A file lands in the bucket of its path hash, and the bucket count only changes when a folder doubles its size, so adding
// or removing a file touches one pack of its folder instead of shifting every pack after it.
function splitBySize(files: SizedFile[], cap: number): SizedFile[][] {
  const packs: SizedFile[][] = [];
  let current: SizedFile[] = [];
  let size = 0;
  for (const file of files) {
    if (current.length > 0 && size + file.size > cap) {
      packs.push(current);
      current = [];
      size = 0;
    }
    current.push(file);
    size += file.size;
  }
  return current.length > 0 ? [...packs, current] : packs;
}

export function planPacks(files: SizedFile[], cap = PACK_SIZE_CAP): SizedFile[][] {
  const groups = new Map<string, SizedFile[]>();
  for (const file of [...files].sort((a, b) => compare(a.path, b.path))) {
    const key = groupKey(file.path);
    groups.set(key, [...(groups.get(key) ?? []), file]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => compare(a, b))
    .flatMap(([, group]) => {
      const total = group.reduce((sum, file) => sum + file.size, 0);
      const bucketCount = nextPowerOfTwo(Math.ceil(total / (cap / 2)));
      const buckets = Array.from({ length: bucketCount }, (): SizedFile[] => []);
      for (const file of group) buckets[hashOf(file.path) % bucketCount]!.push(file);
      return buckets.flatMap((bucket) => splitBySize(bucket, cap));
    });
}

export function packSlug(files: SizedFile[]): string {
  return groupKey(files[0]!.path).replace(/^\.\//, '').replace(/[^a-z0-9]+/gi, '-');
}
