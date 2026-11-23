import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { ArticleLinkerContext, type ArticleLinker } from './articleLinker';
import { AchievementCatalogue } from './AchievementCatalogue';

afterEach(() => prefsStore.getState().setLanguage('en'));

const linker = { entry: () => ({ href: '#' }), rules: () => ({ href: '#' }), article: () => ({ href: '#' }) } as unknown as ArticleLinker;
const render = () => renderToStaticMarkup(<ArticleLinkerContext.Provider value={linker}><AchievementCatalogue /></ArticleLinkerContext.Provider>);

describe('the Achievements article', () => {
  it.each(['en', 'fr'] as const)('lists every Achievement in %s', (language) => {
    prefsStore.getState().setLanguage(language);
    const html = render();
    for (const achievement of ACHIEVEMENTS) expect(html).toContain(achievement.name[language].replace(/'/g, '&#x27;'));
  });
});
