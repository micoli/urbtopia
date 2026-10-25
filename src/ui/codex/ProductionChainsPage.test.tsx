import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { ProductionChainsPage } from './ProductionChainsPage';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (state: GameState) => {
  context.state = state;
  return renderToStaticMarkup(<ProductionChainsPage />).replaceAll('&#x27;', "'");
};

describe('ProductionChainsPage', () => {
  it.each(['en', 'fr'] as const)('draws every root, the Bakery and where bread is sold in %s', (language) => {
    prefsStore.getState().setLanguage(language);
    const html = render(newGame({ seed: 'chains', now: 0 }));
    expect(html).toContain(t('codex.chains.title'));
    for (const building of ['workshop', 'marina', 'farm', 'oliveTree', 'appleTree', 'cherryTree', 'mulberryTree', 'hive', 'bakery', 'livestockFarm', 'dairy'] as const) expect(html).toContain(t(`building.${building}`));
    expect(html).toContain(`${t('building.bakery')} · ${t('shop.counter')}`);
  });

  it('shows the copies built of a building', () => {
    const base = newGame({ seed: 'chains', now: 0 });
    const state: GameState = { ...base, nextId: base.nextId + 2, buildings: [...base.buildings, createBuilding(base.nextId, 'bakery', 56, 59, 0), createBuilding(base.nextId + 1, 'bakery', 60, 59, 0)] };
    expect(render(state)).toContain('×2');
    expect(render(base)).toContain(t('codex.chains.notBuilt'));
  });
});
