import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';

const SPLASH_FILES = ['splash-paysage.jpeg', 'splash-portrait.jpeg'];

export function listFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

export function stampSource(source: string, buildId: string, precachedFiles: string[]): string {
  return source.replace('__BUILD_ID__', buildId).replace('__PRECACHED_FILES__', JSON.stringify(precachedFiles));
}

// Makes sw.js differ on every build so browsers detect the update, and precaches the 3D models for offline play.
export function stampServiceWorker(buildId: string): Plugin {
  return {
    name: 'stamp-service-worker',
    apply: 'build',
    writeBundle(options) {
      const outDir = options.dir ?? 'dist';
      const models = [...listFiles(join(outDir, 'models')), ...SPLASH_FILES.map((file) => join(outDir, file)).filter(existsSync)].map((file) => `./${relative(outDir, file).split('\\').join('/')}`);
      const target = join(outDir, 'sw.js');
      writeFileSync(target, stampSource(readFileSync(target, 'utf8'), buildId, models));
    },
  };
}
