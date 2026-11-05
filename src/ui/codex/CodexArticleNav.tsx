import type { Article, ArticleSection } from '../../guide/content/articles';
import { translationOf } from '../../guide/content/articles';
import { GUIDE_SECTIONS } from '../../guide/routes';
import type { Language } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { AccordionSection } from '../common/AccordionSection';

export const ARTICLE_GROUPS = GUIDE_SECTIONS.flatMap(({ id, title }) => id === 'codex' ? [] : [{ id: id as ArticleSection, title }]);

interface CodexArticleNavProps {
  idPrefix: string;
  articles: readonly Article[];
  language: Language;
  current: Article | null;
  forceOpen: boolean;
  openGroup: string;
  onToggle: (group: string) => void;
  onChoose: (article: Article) => void;
}

export function CodexArticleNav({ idPrefix, articles, language, current, forceOpen, openGroup, onToggle, onChoose }: CodexArticleNavProps) {
  return ARTICLE_GROUPS.map(({ id, title }) => {
    const group = articles.filter(article => article.section === id);
    if (group.length === 0) return null;
    const expanded = forceOpen || openGroup === title;
    return (
      <AccordionSection key={id} id={`${idPrefix}-${id}`} title={t(title)} expanded={expanded} chevron toggleClassName="codex-section-toggle" onToggle={() => onToggle(expanded ? '' : title)}>
        {group.map(article => (
          <button key={article.slug} type="button" aria-current={article === current ? 'true' : undefined} onClick={() => onChoose(article)}>{translationOf(article, language).meta.title}</button>
        ))}
      </AccordionSection>
    );
  });
}
