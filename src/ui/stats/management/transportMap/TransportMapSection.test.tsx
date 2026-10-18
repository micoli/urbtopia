import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildTransportMap } from './transportMapModel.ts';
import { TransportMapCanvas } from './TransportMapCanvas.tsx';
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
    expect(html).toContain('aria-label="Zoom in"');
    expect(html).toContain('aria-label="Zoom out"');
    expect(html).not.toContain('transport-map-coordinates');
    expect(html).toContain('Coordinates');
    expect(html).toContain('transport-map-transfer');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });

  it('draws the roads, the Pedestrian ways and where they join the stops when asked', () => {
    const state = { ...transportMapCity(), pedestrianWays: [{ x: 14, y: 3 }, { x: 15, y: 3 }] };
    const model = buildTransportMap(state, transportStats(state));
    const render = (roads: boolean, pedestrianWays: boolean) => renderToStaticMarkup(
      <TransportMapCanvas model={model} lines={model.lines} selection={null} roads={roads} pedestrianWays={pedestrianWays} showCoordinates={false} onSelect={() => undefined} />,
    );
    expect(render(false, false)).not.toContain('transport-map-layers');
    expect(render(false, false)).toMatch(/^<div class="transport-map-canvas">.*<div class="transport-map-controls">.*<\/div><\/div>$/s);
    const roadsOnly = render(true, false);
    expect(roadsOnly).toContain('transport-map-roads');
    expect(roadsOnly).toContain('data-network="road"');
    expect(roadsOnly).not.toContain('transport-map-pedestrian-ways');
    const both = render(true, true);
    expect(both).toContain('transport-map-pedestrian-ways');
    expect(both).toContain('data-network="pedestrianWay"');
    expect(both).not.toContain('NaN');
  });

  it('shows the coordinates under the names, in grey, only when asked', () => {
    const state = transportMapCity();
    const model = buildTransportMap(state, transportStats(state));
    const render = (showCoordinates: boolean) => renderToStaticMarkup(
      <TransportMapCanvas model={model} lines={model.lines} selection={null} roads={false} pedestrianWays={false} showCoordinates={showCoordinates} onSelect={() => undefined} />,
    );
    expect(render(false)).not.toContain('transport-map-coordinates');
    expect(render(true)).toMatch(/<tspan[^>]*class="transport-map-coordinates"[^>]*fill="#9ca3af"[^>]*>\(14, 1\)<\/tspan>/);
  });
});
