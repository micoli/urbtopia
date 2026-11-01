import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ArticlePage } from './ArticlePage';
import { GuideRouteContext } from './guideRouteContext';
import { GUIDE_ROUTES } from './routes';

describe('ArticleLink', () => {
  it('links the Events for Tourists page to the Tourism page', () => {
    const route = GUIDE_ROUTES.find(candidate => candidate.path === 'fr/mechanics/gatherings/')!;
    if (route.page.kind !== 'article') throw new Error('not an article');
    const html = renderToStaticMarkup(<GuideRouteContext.Provider value={route}><ArticlePage route={route} article={route.page.article} /></GuideRouteContext.Provider>);
    expect(html).toContain('href="../../../fr/mechanics/tourism/"');
  });
});
