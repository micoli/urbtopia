import { unzipSync } from 'fflate';

export interface ExtractedFile {
  path: string;
  data: Uint8Array;
}

const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1);

// Keeps the wanted GLB models and the colour map they reference, laid out as `<name>.glb` and `Textures/colormap.png`.
// Some packs ship the colour map only next to the FBX models, so those are used as a fallback.
export function extractPack(zip: Uint8Array, files: string[]): ExtractedFile[] {
  const wanted = new Set(files.map((file) => `${file}.glb`));
  const entries = unzipSync(zip, {
    filter: ({ name }) => (name.endsWith('.glb') && wanted.has(baseName(name))) || name.endsWith('/Textures/colormap.png'),
  });

  const paths = Object.keys(entries);
  const models = paths.filter((path) => path.endsWith('.glb'));
  const textures = paths.filter((path) => path.endsWith('colormap.png'));
  const texture = textures.find((path) => path.includes('GLB format')) ?? textures[0];

  const missing = [...wanted].filter((file) => !models.some((path) => baseName(path) === file));
  if (missing.length > 0) throw new Error(`Missing in the archive: ${missing.join(', ')}`);
  if (!texture) throw new Error('No Textures/colormap.png in the archive');

  return [
    ...models.map((path) => ({ path: baseName(path), data: entries[path] as Uint8Array })),
    { path: 'Textures/colormap.png', data: entries[texture] as Uint8Array },
  ];
}
