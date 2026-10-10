import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CODEX_ENTRIES, codexImageKey, validateCodexManifest, type CodexManifest } from '../src/codex/catalog';

const codexDir = join('dist', 'codex');

describe.skipIf(!existsSync(join(codexDir, 'manifest.json')))('Codex images in the build', () => {
  it('has a generated image for every codex page and evolution', () => {
    const manifest = JSON.parse(readFileSync(join(codexDir, 'manifest.json'), 'utf8')) as CodexManifest;
    validateCodexManifest(manifest);
    for (const entry of CODEX_ENTRIES) {
      for (const level of entry.levels) {
        const file = manifest.images[codexImageKey(entry.id, level)];
        expect(file, `${entry.id}, level ${level}`).toBeDefined();
        expect(existsSync(join(codexDir, file!)), `${entry.id}, level ${level}`).toBe(true);
      }
    }
  });
});
