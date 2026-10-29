import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createBuilding } from '../../core';
import { BuildingIcon } from './BuildingIcon';

const context = vi.hoisted(() => ({ images: {} as Record<string, string> | null }));
vi.mock('../codex/useCodexManifest', () => ({ useCodexManifest: () => ({ manifest: context.images ? { images: context.images } : null }) }));

describe('BuildingIcon', () => {
  it('shows the picture of the building at its own Tier, with the Tier as a badge', () => {
    context.images = { 'shop:1': 'shop-1.png', 'shop:3': 'shop-3.png' };
    const html = renderToStaticMarkup(<BuildingIcon building={{ ...createBuilding(1, 'shop', 8, 8, 0), tier: 3 }} />);
    expect(html).toContain('codex/shop-3.png');
    expect(html).toContain('alt=""');
    expect(html).toMatch(/<small class="side-panel-header__level"[^>]*>3<\/small>/);
    expect(html).toContain('aria-label="Tier 3"');
  });

  it('falls back on the first Tier when its own picture is missing, and keeps the badge on the real Tier', () => {
    context.images = { 'shop:1': 'shop-1.png' };
    const html = renderToStaticMarkup(<BuildingIcon building={{ ...createBuilding(1, 'shop', 8, 8, 0), tier: 4 }} />);
    expect(html).toContain('codex/shop-1.png');
    expect(html).toContain('>4</small>');
  });

  it('keeps the Tier badge while the pictures are not loaded', () => {
    context.images = null;
    const html = renderToStaticMarkup(<BuildingIcon building={createBuilding(1, 'shop', 8, 8, 0)} />);
    expect(html).not.toContain('<img');
    expect(html).toContain('>1</small>');
  });
});
