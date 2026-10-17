import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FloatingBadges } from './FloatingBadges';

const context = vi.hoisted(() => ({ serviceCoverageOpen: false }));
vi.mock('../common/hooks', () => ({ useUi: (selector: (state: typeof context) => unknown) => selector(context) }));
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
});
