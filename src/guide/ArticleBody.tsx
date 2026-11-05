import type { Language } from '../i18n/prefsStore';
import { t } from '../i18n/t';
import { ArticleLink } from './content/ArticleLink';
import { EntryLink } from './content/EntryLink';
import { LiveRules } from './content/LiveRules';
import { MechanicsLink } from './content/MechanicsLink';
import { isTranslated, translationOf, type Article } from './content/articles';

interface ArticleBodyProps {
  article: Article;
  language: Language;
}

const ARTICLE_COMPONENTS = { ArticleLink, EntryLink, LiveRules, MechanicsLink };

export function ArticleBody({ article, language }: ArticleBodyProps) {
  const { default: Content, meta } = translationOf(article, language);
  const translated = isTranslated(article, language);
  return (
    <>
      {!translated && <p role="note" lang={language} className="guide-not-translated">{t('guide.notTranslated')}</p>}
      <div lang={translated ? undefined : 'en'}>
        <h1>{meta.title}</h1>
        <p className="guide-summary">{meta.summary}</p>
        <Content components={ARTICLE_COMPONENTS} />
      </div>
    </>
  );
}
