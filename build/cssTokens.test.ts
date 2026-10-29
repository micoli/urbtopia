import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Artwork and dev tools keep their own literals: the game UI must go through the tokens.
const EXEMPT = ['src/tokens.css', 'src/guide/', 'src/ui/proto/', 'src/ui/casino/games/blockMatch/', 'src/devtools/'];

const LITERALS: [string, RegExp][] = [
  ['color', /#[0-9a-fA-F]{3,8}\b|rgba?\(/],
  ['border-radius', /border-radius:\s*[^;]*\b[1-9]\d*px/],
  ['font-size', /font-size:\s*\d+px/],
];

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return path.endsWith('.css') ? [path] : [];
  });
}

describe('game styles', () => {
  it('use design tokens instead of literal colors, radii and font sizes', () => {
    const offenders = cssFiles('src')
      .filter((file) => !EXEMPT.some((prefix) => file.startsWith(prefix)))
      .flatMap((file) => readFileSync(file, 'utf8').split('\n').flatMap((line, index) => {
        if (line.includes('var(--')) {
          const withoutVars = line.replace(/var\([^)]*\)/g, '');
          return LITERALS.some(([, pattern]) => pattern.test(withoutVars)) ? [`${file}:${index + 1} ${line.trim()}`] : [];
        }
        return LITERALS.some(([, pattern]) => pattern.test(line)) ? [`${file}:${index + 1} ${line.trim()}`] : [];
      }));
    expect(offenders).toEqual([]);
  });
});
