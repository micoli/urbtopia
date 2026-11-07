import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';

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

export function stampSource(source: string, buildId: string, precachedFiles: string[], versionedFiles: Record<string, string> = {}): string {
  return source
    .replace('__BUILD_ID__', buildId)
    .replace('__PRECACHED_FILES__', JSON.stringify(precachedFiles))
    .replace('__VERSIONED_FILES__', JSON.stringify(versionedFiles));
}

const toUrlPath = (outDir: string, file: string) => `./${relative(outDir, file).split('\\').join('/')}`;

// Makes sw.js differ on every build so browsers detect the update. The shell is precached; the 3D models and Codex
// previews go to a cache that survives builds, keyed by content hash, so a deploy only re-downloads what changed.
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
      const versioned = Object.fromEntries(
        [...listFiles(join(outDir, 'models')), ...listFiles(join(outDir, 'codex'))]
          .filter((file) => toUrlPath(outDir, file) !== `./${CODEX_MANIFEST}`)
          .map((file) => [toUrlPath(outDir, file), createHash('md5').update(readFileSync(file)).digest('hex').slice(0, VERSION_LENGTH)]),
      );
      const target = join(outDir, 'sw.js');
      writeFileSync(target, stampSource(readFileSync(target, 'utf8'), buildId, shell, versioned));
    },
  };
}
