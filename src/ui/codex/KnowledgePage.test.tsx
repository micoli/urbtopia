import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KNOWLEDGE, createBuilding, newGame, type Building, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { KnowledgePage } from './KnowledgePage';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (buildings: Building[]) => {
  context.state = { ...newGame({ seed: 'knowledge-page', now: 0 }), buildings, nextId: 1000, tutorial: null, adaptationUntil: 0 };
  return renderToStaticMarkup(<KnowledgePage />).replaceAll('&#x27;', "'");
};

const schooled = [createBuilding(1, 'school', 50, 50, 0), createBuilding(2, 'library', 54, 50, 0), createBuilding(3, 'home', 52, 54, 0)];

describe('KnowledgePage', () => {
  it.each(['en', 'fr'] as const)('shows every section with no placeholder left in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render(schooled);
    for (const key of ['codex.knowledge.title', 'codex.knowledge.city', 'codex.knowledge.sources', 'codex.knowledge.effects', 'codex.knowledge.sanction'] as const) expect(html).toContain(t(key));
    expect(html).not.toContain('{');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });

  it('shows the Knowledge of the city and the points of each source', () => {
    const html = render(schooled);
    expect(html).toContain(`${t('codex.knowledge.libraryTier').replace('{tier}', '5')}</th><td>${KNOWLEDGE.library[4]}`);
    expect(html).toContain('20.1');
  });

  it('says so when the city has no Citizens', () => {
    expect(render([])).toContain(t('codex.knowledge.noCitizens'));
  });

  it('gives every effect at its maximum and now', () => {
    const html = render(schooled);
    expect(html).toContain('<td>25.0%</td>');
    expect(html).toContain('<td>+8.0</td>');
  });
});
