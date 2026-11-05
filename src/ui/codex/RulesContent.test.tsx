import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CODEX_PAGES } from '../../codex/pages';
import { newGame } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { RulesContent } from './RulesContent';
import { RulesStateContext } from './rulesStateContext';
import { CODEX_PAGE_COMPONENTS } from './codexPageComponents';

vi.mock('../common/hooks', () => ({ useGame: () => ({}), useUi: () => ({}) }));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (id: (typeof CODEX_PAGES)[number]['id']) => renderToStaticMarkup(
  <RulesStateContext value={newGame({ seed: 'rules-content', now: Date.UTC(2026, 0, 1) })}><RulesContent id={id} /></RulesStateContext>,
).replaceAll('&#x27;', "'");

describe('RulesContent', () => {
  it('has a game page for every rule page', () => {
    expect(Object.keys(CODEX_PAGE_COMPONENTS).sort()).toEqual(CODEX_PAGES.map(({ id }) => id).sort());
  });

  it.each(['en', 'fr'] as const)('shows every rule page in %s with its title and no placeholder left', language => {
    prefsStore.getState().setLanguage(language);
    for (const { id, title } of CODEX_PAGES) {
      const html = render(id);
      expect(html, id).toContain(t(title));
      expect(html, id).not.toMatch(/\{[a-z]+\}/i);
      expect(html, id).not.toContain('NaN');
      expect(html, id).not.toContain('undefined');
    }
  });
});

describe('the Day cycle page', () => {
  it('lists the 24 Cycle hours', () => {
    expect(render('dayCycle').match(/<tr/g)).toHaveLength(25);
  });
});

describe('the Annual events page', () => {
  it('names every event with its window in the player language', () => {
    prefsStore.getState().setLanguage('fr');
    expect(render('annualEvents')).toContain(t('annualEvent.halloween'));
  });
});
