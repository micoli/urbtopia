import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflows = '.github/workflows';
const installed = JSON.parse(readFileSync('node_modules/playwright-core/package.json', 'utf8')).version as string;

describe('Playwright container image of the workflows', () => {
  const images = readdirSync(workflows)
    .filter((file) => file.endsWith('.yml'))
    .flatMap((file) => [...readFileSync(join(workflows, file), 'utf8').matchAll(/mcr\.microsoft\.com\/playwright:v([\d.]+)-\S+/g)].map((match) => ({ file, version: match[1], reference: match[0] })));

  it('is used by the workflows that drive a browser', () => {
    expect(images.map(({ file }) => file).sort()).toEqual(['deploy.yml', 'storybook.yml', 'visual.yml']);
  });

  it.each(images)('$file runs the version of Playwright that is installed', ({ version }) => {
    expect(version).toBe(installed);
  });

  it.each(images)('$file pins the image by digest', ({ reference }) => {
    expect(reference).toMatch(/@sha256:[0-9a-f]{64}$/);
  });
});
