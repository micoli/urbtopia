import { describe, expect, it } from 'vitest';
import type { CodexManifest } from '../codex/catalog';
import { renderGuidePage } from './server';
import { GUIDE_ROUTES } from './routes';

const manifest: CodexManifest = { fingerprint: 'test', images: {} };

describe('renderGuidePage', () => {
  it('prerenders every Mechanics page and article in both languages', () => {
    const routes = GUIDE_ROUTES.filter(route => route.page.kind === 'rules' || route.page.kind === 'article');
    expect(routes.length).toBeGreaterThan(30);
    for (const route of routes) {
      const { html } = renderGuidePage(route, manifest);
      expect(html, route.path).toContain('<h');
      expect(html, route.path).not.toContain('NaN');
    }
  });
});
