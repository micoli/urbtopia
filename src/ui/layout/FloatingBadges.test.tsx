import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FloatingBadges } from './FloatingBadges';

const context = vi.hoisted(() => ({ serviceCoverageOpen: false, visit: { kind: 'idle' } as { kind: string } }));
vi.mock('../common/hooks', () => ({
  useUi: (selector: (state: typeof context) => unknown) => selector(context),
  useShowcase: (selector: (state: typeof context) => unknown) => selector(context),
}));
vi.mock('../collect/CollectBadges', () => ({ CollectBadges: () => 'collect' }));
vi.mock('../sanction/SanctionBadges', () => ({ SanctionBadges: () => 'sanctions' }));
vi.mock('../common/WorkingIndicators', () => ({ WorkingIndicators: () => 'working' }));
vi.mock('../parcels/ParcelTags', () => ({ ParcelTags: () => 'parcels' }));

describe('floating badges', () => {
  it('hides every badge during the heatmap and restores them when it closes', () => {
    context.serviceCoverageOpen = false;
    const normal = renderToStaticMarkup(<FloatingBadges />);
    for (const name of ['collect', 'sanctions', 'working', 'parcels']) expect(normal).toContain(name);
    context.serviceCoverageOpen = true;
    expect(renderToStaticMarkup(<FloatingBadges />)).toBe('');
    context.serviceCoverageOpen = false;
    expect(renderToStaticMarkup(<FloatingBadges />)).toBe(normal);
  });

  it('hides every badge while visiting another city and restores them afterwards', () => {
    context.visit = { kind: 'idle' };
    const normal = renderToStaticMarkup(<FloatingBadges />);
    context.visit = { kind: 'visiting' };
    expect(renderToStaticMarkup(<FloatingBadges />)).toBe('');
    context.visit = { kind: 'idle' };
    expect(renderToStaticMarkup(<FloatingBadges />)).toBe(normal);
  });
});
