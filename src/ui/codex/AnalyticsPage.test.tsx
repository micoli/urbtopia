import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { ANALYTICS_LAYERS, CONGESTION, ECOLOGY, LAND_VALUE } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { AnalyticsPage } from './AnalyticsPage';

afterEach(() => prefsStore.getState().setLanguage('en'));

describe('AnalyticsPage', () => {
  it.each(['en', 'fr'] as const)('shows every section with no placeholder left in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = renderToStaticMarkup(<AnalyticsPage />).replaceAll('&#x27;', "'");
    for (const key of ['codex.analytics.title', 'codex.analytics.layers', 'codex.analytics.figures', 'codex.analytics.landValue', 'codex.analytics.reading'] as const) expect(html).toContain(t(key));
    for (const layer of ANALYTICS_LAYERS) expect(html).toContain(t(`analytics.layer.${layer}`));
    expect(html).not.toContain('{');
    expect(html).not.toContain('undefined');
  });

  it('shows the figures of the balance', () => {
    const html = renderToStaticMarkup(<AnalyticsPage />);
    expect(html).toContain(`>${ECOLOGY.coalWellbeingCap}<`);
    expect(html).toContain(`>${CONGESTION.maxRatio * 100}<`);
    expect(html).toContain(`${Math.round(LAND_VALUE.maxNuisanceCut * 100)}%`);
  });
});
