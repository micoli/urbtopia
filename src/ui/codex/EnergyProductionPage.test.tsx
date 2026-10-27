import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ENERGY_SOURCES, createBuilding, newGame, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { EnergyProductionPage } from './EnergyProductionPage';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (state: GameState) => {
  context.state = state;
  return renderToStaticMarkup(<EnergyProductionPage />).replaceAll('&#x27;', "'");
};

const withPlants = (): GameState => {
  const base = newGame({ seed: 'energy-page', now: 0 });
  return {
    ...base, nextId: base.nextId + 2, waterTiles: [{ x: 50, y: 50 }, { x: 51, y: 50 }],
    buildings: [...base.buildings, createBuilding(base.nextId, 'hydroPlant', 50, 48, 0), createBuilding(base.nextId + 1, 'geothermalPlant', 30, 30, 0)],
  };
};

describe('EnergyProductionPage', () => {
  it.each(['en', 'fr'] as const)('lists every source in %s', (language) => {
    prefsStore.getState().setLanguage(language);
    const html = render(newGame({ seed: 'energy-page', now: 0 }));
    expect(html).toContain(t('codex.energy.title'));
    for (const source of ENERGY_SOURCES) expect(html).toContain(t(`eco.${source}`));
  });

  it('charts the next 4 hours of every renewable source', () => {
    const html = render(newGame({ seed: 'energy-page', now: 0 }));
    expect(html).toContain(`aria-label="${t('codex.energy.forecast')}"`);
    expect(html).toContain('+4h');
    expect(html.match(/<polyline/g)).toHaveLength(4);
  });

  it('shows the Flow factor of a built Hydro power plant', () => {
    const html = render(withPlants());
    expect(html).toContain('25%');
    expect(html).not.toContain(t('codex.energy.noHydro'));
  });

  it('says so when no Hydro power plant is built', () => {
    expect(render(newGame({ seed: 'energy-page', now: 0 }))).toContain(t('codex.energy.noHydro'));
  });
});
