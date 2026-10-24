import { t } from '../i18n/t';
import { EntryLink } from './content/EntryLink';
import { LiveRules } from './content/LiveRules';
import { MechanicsLink } from './content/MechanicsLink';
import { isTranslated, translationOf, type Article } from './content/articles';
import type { GuideRoute } from './routes';

interface ArticlePageProps {
  route: GuideRoute;
  article: Article;
}

const ARTICLE_COMPONENTS = { EntryLink, LiveRules, MechanicsLink };

export function ArticlePage({ route, article }: ArticlePageProps) {
  const { default: Content, meta } = translationOf(article, route.language);
  return (
    <article className="guide-prose max-w-4xl">
      {!isTranslated(article, route.language) && <p role="note" lang={route.language} className="rounded-lg border border-line bg-panel px-4 py-2 text-sm text-muted">{t('guide.notTranslated')}</p>}
      <div lang={isTranslated(article, route.language) ? undefined : 'en'}>
        <h1>{meta.title}</h1>
        <p className="text-lg text-muted">{meta.summary}</p>
        <Content components={ARTICLE_COMPONENTS} />
      </div>
    </article>
  );
}
