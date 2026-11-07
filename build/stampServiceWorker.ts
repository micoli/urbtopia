import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';
import { packSlug, planPacks, type VersionedFile } from './packFiles';

const SPLASH_FILE = /^splash-.+\.jpeg$/;
const ICON_FOLDER = 'assets';
const CODEX_MANIFEST = 'codex/manifest.json';
const VERSION_LENGTH = 10;

export function listFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

export function stampSource(
  source: string,
  buildId: string,
  precachedFiles: string[],
  versionedFiles: Record<string, VersionedFile> = {},
  packFiles: string[] = [],
): string {
  return source
    .replace('__BUILD_ID__', buildId)
    .replace('__PRECACHED_FILES__', JSON.stringify(precachedFiles))
    .replace('__PACK_FILES__', JSON.stringify(packFiles))
    .replace('__VERSIONED_FILES__', JSON.stringify(versionedFiles));
}

const toUrlPath = (outDir: string, file: string) => `./${relative(outDir, file).split('\\').join('/')}`;

// Writes the models and Codex previews into a few packs, one request each, next to the individual files.
function writePacks(outDir: string, files: string[]): { packFiles: string[]; versioned: Record<string, VersionedFile> } {
  const packFolder = join(outDir, 'packs');
  mkdirSync(packFolder, { recursive: true });
  const sized = files.map((file) => ({ path: toUrlPath(outDir, file), size: statSync(file).size }));
  const packFiles: string[] = [];
  const versioned: Record<string, VersionedFile> = {};
  for (const pack of planPacks(sized)) {
    const buffers = pack.map((file) => readFileSync(join(outDir, file.path)));
    const data = Buffer.concat(buffers);
    const name = `${packSlug(pack)}-${createHash('md5').update(data).digest('hex').slice(0, VERSION_LENGTH)}.bin`;
    writeFileSync(join(packFolder, name), data);
    const index = packFiles.push(`./packs/${name}`) - 1;
    let offset = 0;
    pack.forEach((file, position) => {
      const buffer = buffers[position]!;
      versioned[file.path] = [createHash('md5').update(buffer).digest('hex').slice(0, VERSION_LENGTH), index, offset, buffer.length];
      offset += buffer.length;
    });
  }
  return { packFiles, versioned };
}

// Makes sw.js differ on every build so browsers detect the update. The shell is precached; the 3D models and Codex
// previews go to a cache that survives builds, keyed by content hash, filled one pack at a time.
export function stampServiceWorker(buildId: string): Plugin {
  return {
    name: 'stamp-service-worker',
    apply: 'build',
    writeBundle(options) {
      const outDir = options.dir ?? 'dist';
      const shell = [
        ...readdirSync(outDir).filter((file) => SPLASH_FILE.test(file)).map((file) => join(outDir, file)),
        ...listFiles(join(outDir, ICON_FOLDER)).filter((file) => file.endsWith('.png')),
        ...(existsSync(join(outDir, CODEX_MANIFEST)) ? [join(outDir, CODEX_MANIFEST)] : []),
      ].map((file) => toUrlPath(outDir, file));
      const packable = [...listFiles(join(outDir, 'models')), ...listFiles(join(outDir, 'codex'))].filter((file) => toUrlPath(outDir, file) !== `./${CODEX_MANIFEST}`);
      const { packFiles, versioned } = writePacks(outDir, packable);
      const target = join(outDir, 'sw.js');
      writeFileSync(target, stampSource(readFileSync(target, 'utf8'), buildId, shell, versioned, packFiles));
    },
  };
}
