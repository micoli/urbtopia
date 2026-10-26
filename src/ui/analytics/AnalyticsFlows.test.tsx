import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { WALKING } from '../../core/traffic/walking';
import { createBuilding, newGame, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { AnalyticsFlows } from './AnalyticsFlows';

const context = vi.hoisted(() => ({ state: null as GameState | null, layer: 'movement.cars' as string | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
  useUi: (selector: (store: { analyticsLayer: string | null; showTile: () => void }) => unknown) => selector({ analyticsLayer: context.layer, showTile: () => {} }),
}));

const city = (): GameState => {
  const state = newGame({ seed: 'analytics-flows', now: 0 });
  return { ...state, buildings: [...state.buildings, { ...createBuilding(state.nextId, 'home', 56, 59, 0), tier: 2 }], nextId: state.nextId + 1 };
};

describe('AnalyticsFlows', () => {
  it('lists the main departures and destinations of a Movement layer', () => {
    WALKING.enabled = false;
    context.state = city();
    const html = renderToStaticMarkup(<AnalyticsFlows />);
    expect(html).toContain(t('analytics.flows.origins'));
    expect(html).toContain(t('analytics.flows.destinations'));
    expect(html).toContain(t('building.home'));
    WALKING.enabled = true;
  });

  it('shows nothing for a Data layer', () => {
    context.state = city();
    context.layer = 'data.pollution';
    expect(renderToStaticMarkup(<AnalyticsFlows />)).toBe('');
    context.layer = 'movement.cars';
  });
});
