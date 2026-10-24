import { unzipSync } from 'fflate';

export interface ExtractedFile {
  path: string;
  data: Uint8Array;
}

const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1);

export function extractFbx(zip: Uint8Array): ExtractedFile[] {
  const entries = unzipSync(zip, { filter: ({ name }) => name.endsWith('.fbx') });
  return Object.entries(entries).map(([path, data]) => ({ path: baseName(path), data }));
}
