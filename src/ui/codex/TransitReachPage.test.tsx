import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, TRANSIT_REACH, type GameState, type TransitTile } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { TransitReachPage } from './TransitReachPage';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const strip: TransitTile[] = Array.from({ length: 45 }, (_, i) => ({ x: i, y: 0, exits: i === 0 ? ['E'] : i === 44 ? ['W'] : ['W', 'E'] }));

const render = (withLine: boolean, withFacility = true) => {
  context.state = { ...newGame({ seed: 'transit-reach-page', now: 0 }), adaptationUntil: 0, roundabouts: [], brtRoads: strip,
    buildings: [...(withFacility ? [createBuilding(1, 'school', 3, 3, 0)] : []), { ...createBuilding(2, 'home', 40, 3, 0), tier: 2 }, createBuilding(3, 'brtStation', 3, 1, 0), createBuilding(4, 'brtStation', 40, 1, 0)],
    ...(withLine ? { transitLines: [{ id: 10, mode: 'brt' as const, stops: [3, 4], peakHeadway: 5, offPeakHeadway: 10 }], transitFleet: [{ id: 11, kind: 'brtElectric' as const, purchasePrice: 900, lineId: 10 }] } : {}) };
  return renderToStaticMarkup(<TransitReachPage />);
};

describe('TransitReachPage', () => {
  it.each(['en', 'fr'] as const)('shows every section with no placeholder left in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render(true);
    for (const key of ['codex.transitReach.title', 'codex.transitReach.rules', 'codex.transitReach.network', 'codex.transitReach.categories', 'codex.transitReach.perFacility'] as const) expect(html).toContain(t(key));
    expect(html).not.toContain('{');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });

  it('reads the threshold from the balance data', () => {
    expect(render(true)).toContain(`<dd>${TRANSIT_REACH.maxMinutes}</dd>`);
  });

  it('counts the Home reached through transit', () => {
    const html = render(true);
    expect(html).toContain(`>${t('service.education')}</th><td>1</td><td>0</td><td>1</td>`);
  });

  it('says so when no line serves reach', () => {
    expect(render(false)).toContain(t('codex.transitReach.noLine'));
  });

  it('says so when no facility is built', () => {
    expect(render(true, false)).toContain(t('codex.transitReach.noFacility'));
  });
});
