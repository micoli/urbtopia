import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RAMPS } from '../../scene/analyticsRamps';
import { AnalyticsLegend } from './AnalyticsLegend';

describe('analytics legend', () => {
  it('shows the bounds and the ramp', () => {
    const html = renderToStaticMarkup(<AnalyticsLegend legend={{ ramp: 'heat', max: 20 }} />);
    expect(html).toContain('>0<');
    expect(html).toContain('>20<');
    expect(html).toContain(RAMPS.heat[0]);
  });
});
