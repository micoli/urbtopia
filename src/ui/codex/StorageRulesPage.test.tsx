import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_TYPES, createBuilding, newGame, storageCapacity, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { StorageRulesPage } from './StorageRulesPage';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (state: GameState) => {
  context.state = state;
  return renderToStaticMarkup(<StorageRulesPage />).replaceAll('&#x27;', "'");
};

describe('StorageRulesPage', () => {
  it.each(['en', 'fr'] as const)('lists every storage building in %s', (language) => {
    prefsStore.getState().setLanguage(language);
    const html = render(newGame({ seed: 'storage-rules', now: 0 }));
    expect(html).toContain(t('codex.storage.title'));
    for (const type of STORAGE_TYPES) expect(html).toContain(t(`building.${type}`));
  });

  it('shows the live capacity and the copies built', () => {
    const base = newGame({ seed: 'storage-rules', now: 0 });
    const state: GameState = { ...base, nextId: base.nextId + 1, buildings: [...base.buildings, createBuilding(base.nextId, 'storehouse', 56, 59, 0)] };
    const html = render(state);
    expect(html).toContain(`0/${storageCapacity(state).materials}`);
    expect(html).toContain('1/3');
  });
});
