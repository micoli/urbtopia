export const PACK_SIZE_CAP = 8 * 1024 * 1024;

export type SizedFile = { path: string; size: number };
export type VersionedFile = [version: string, pack: number, offset: number, size: number];

// Files of one folder travel together: './models/roads/a.glb' belongs to './models/roads', './codex/a.png' to './codex'.
export function groupKey(path: string): string {
  const parts = path.split('/');
  return parts.slice(0, parts.length > 3 ? 3 : 2).join('/');
}

// Sorting keeps a pack stable when a file is added elsewhere, so a deploy only invalidates the packs it touches.
export function planPacks(files: SizedFile[], cap = PACK_SIZE_CAP): SizedFile[][] {
  const groups = new Map<string, SizedFile[]>();
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    const key = groupKey(file.path);
    groups.set(key, [...(groups.get(key) ?? []), file]);
  }
  return [...groups.values()].flatMap((group) => {
    const packs: SizedFile[][] = [];
    let current: SizedFile[] = [];
    let size = 0;
    for (const file of group) {
      if (current.length > 0 && size + file.size > cap) {
        packs.push(current);
        current = [];
        size = 0;
      }
      current.push(file);
      size += file.size;
    }
    return current.length > 0 ? [...packs, current] : packs;
  });
}

export function packSlug(files: SizedFile[]): string {
  return groupKey(files[0]!.path).replace(/^\.\//, '').replace(/[^a-z0-9]+/gi, '-');
}
