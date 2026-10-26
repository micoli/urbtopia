import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ANALYTICS_LAYERS } from '../../core';
import { t } from '../../i18n/t';
import { LandMenu } from './LandMenu';

vi.mock('../common/hooks', () => ({
  useUi: (selector: (store: { chooseTool: () => void; enterAnalytics: () => void; lastAnalyticsLayer: string | null }) => unknown) =>
    selector({ chooseTool: () => {}, enterAnalytics: () => {}, lastAnalyticsLayer: 'data.pollution' }),
}));

describe('Land menu', () => {
  const html = renderToStaticMarkup(<LandMenu />);

  it('offers Parcels and both Analytics submenus', () => {
    expect(html).toContain(t('land.parcels'));
    expect(html).toContain(t('analytics.movement'));
    expect(html).toContain(t('analytics.data'));
  });

  it('puts Service coverage at the first level, with a category per item', () => {
    expect(html).toContain('id="land-coverage"');
    expect(html).toContain(t('service.health'));
    expect(html).not.toContain('flyout-sub');
  });

  it('lists every Layer, with the remembered one selected', () => {
    for (const layer of ANALYTICS_LAYERS) expect(html).toContain(t(`analytics.layer.${layer}`));
    expect(html).toMatch(/data-selected="true"[^>]*>\s*<span>Pollution/);
  });
});
