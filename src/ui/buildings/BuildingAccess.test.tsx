import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, frontTiles, newGame, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { BuildingAccess } from './BuildingAccess';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

vi.mock('../common/DrawerPanel', () => ({
  DrawerPanel: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    LabelValue: ({ label, value }: { label: string; value: React.ReactNode }) => <p>{label}: {value}</p>,
  }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const home = createBuilding(900, 'home', 62, 66, 0);
const [front] = frontTiles('home', 62, 66, 0);
const city = (patch: Partial<GameState>): GameState => ({ ...newGame({ seed: 'access', now: 0 }), roads: [], rails: [], brtRoads: [], buildings: [home], ...patch });
const render = () => renderToStaticMarkup(<BuildingAccess building={home} />).replaceAll('&#x27;', "'");

describe('BuildingAccess', () => {
  it.each(['en', 'fr'] as const)('names the access of a BRT compatible building in %s', language => {
    prefsStore.getState().setLanguage(language);
    context.state = city({ brtRoads: [{ ...front!, exits: [] }] });
    expect(render()).toContain(t('panel.access.brt'));
    context.state = city({ roads: [{ ...front!, kind: 'road' }] });
    expect(render()).toContain(t('panel.access.road'));
    context.state = city({ roads: [{ ...front!, kind: 'road' }], brtRoads: [{ ...front!, exits: [] }] });
    expect(render()).toContain(t('panel.access.both'));
    context.state = city({});
    expect(render()).toContain(t('panel.access.none'));
    expect(render()).not.toContain('undefined');
  });

  it('shows nothing for a building that only accepts roads', () => {
    context.state = city({});
    expect(renderToStaticMarkup(<BuildingAccess building={createBuilding(901, 'workshop', 62, 66, 0)} />)).toBe('');
  });
});
