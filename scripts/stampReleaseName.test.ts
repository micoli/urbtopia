import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RELEASE_NAME_PLACEHOLDER, stampReleaseName } from './stampReleaseName.ts';

function distWith(files: Record<string, string>): string {
  const dist = mkdtempSync(join(tmpdir(), 'stamp-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dist, path)), { recursive: true });
    writeFileSync(join(dist, path), content);
  }
  return dist;
}

describe('stampReleaseName', () => {
  it('replaces every occurrence in scripts and pages, nested ones included', () => {
    const dist = distWith({
      'assets/main.js': `a="${RELEASE_NAME_PLACEHOLDER}";b="${RELEASE_NAME_PLACEHOLDER}"`,
      'docs/index.html': RELEASE_NAME_PLACEHOLDER,
      'assets/other.js': 'nothing here',
    });
    expect(stampReleaseName(dist, '2026.11.11.01-orchid')).toBe(2);
    expect(readFileSync(join(dist, 'assets/main.js'), 'utf8')).toBe('a="2026.11.11.01-orchid";b="2026.11.11.01-orchid"');
    expect(readFileSync(join(dist, 'docs/index.html'), 'utf8')).toBe('2026.11.11.01-orchid');
  });

  it('reports no file when the placeholder is absent', () => {
    expect(stampReleaseName(distWith({ 'assets/main.js': 'a="dev"' }), 'x')).toBe(0);
  });
});

describe('the site workflow', () => {
  it('builds with the placeholder as release name', () => {
    expect(readFileSync('.github/workflows/build-test-deploy-site.yml', 'utf8')).toContain(`RELEASE_NAME: ${RELEASE_NAME_PLACEHOLDER}`);
  });
});
