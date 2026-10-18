import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { congestionStats, createBuilding, newGame, transportStats } from '../../../../core';
import { prefsStore } from '../../../../i18n/prefsStore';
import { TransportMapSection } from './TransportMapSection.tsx';
import { transportMapCity } from './transportMapFixture.ts';

describe('Transport map section', () => {
  it.each(['en', 'fr'] as const)('says there is no line yet in %s', language => {
    prefsStore.getState().setLanguage(language);
    const state = { ...newGame({ seed: 'map-empty', now: 0 }), buildings: [createBuilding(1, 'home', 55, 57, 0)] };
    const html = renderToStaticMarkup(<TransportMapSection state={state} transport={transportStats(state)} congestion={congestionStats(state)} />);
    prefsStore.getState().setLanguage('en');
    expect(html).toContain('id="eco-transportMap"');
    expect(html).toContain(language === 'fr' ? 'Carte des transports' : 'Transport map');
    expect(html).toContain(language === 'fr' ? 'Aucune ligne de transport' : 'No transport line yet');
    expect(html).not.toContain('<svg');
  });

  it('draws the lines, the loop arrows, the hub and the bicycle stops', () => {
    const state = transportMapCity();
    const html = renderToStaticMarkup(<TransportMapSection state={state} transport={transportStats(state)} congestion={congestionStats(state)} />);
    expect(html).toContain('<svg');
    expect(html).toContain('data-line="11"');
    expect(html).toContain('data-mode="rail"');
    expect(html).toContain('data-hub="true"');
    expect(html).toContain('transport-map-arrow');
    expect(html).toContain('🚲');
    expect(html).toMatch(/<tspan[^>]*class="transport-map-coordinates"[^>]*fill="#9ca3af"[^>]*>\(14, 1\)<\/tspan>/);
    expect(html).toContain('transport-map-transfer');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });
});
