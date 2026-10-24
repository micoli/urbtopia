import { CODEX_ENTRIES, CODEX_SECTIONS } from '../codex/catalog';
import { CODEX_PAGES } from '../codex/pages';
import { t } from '../i18n/t';
import { ARTICLES, translationOf } from './content/articles';
import { GuideNavLink } from './GuideNavLink';
import { articlePathOf, codexEntryPathOf, codexSectionOf, codexSectionPathOf, isRulesWrittenUp, rulesPathOf, type GuideRoute, type GuideSection } from './routes';

interface GuideNavSectionProps {
  route: GuideRoute;
  section: GuideSection;
}

export function GuideNavSection({ route, section }: GuideNavSectionProps) {
  const { language } = route;
  const articles = ARTICLES.filter(article => article.section === section);
  const articleLinks = articles.map(article => <li key={article.slug}><GuideNavLink route={route} path={articlePathOf(language, article)}>{translationOf(article, language).meta.title}</GuideNavLink></li>);
  if (section === 'mechanics') return (
    <ul className="flex flex-col gap-0.5">
      {articleLinks}
      {CODEX_PAGES.filter(page => !isRulesWrittenUp(page.id)).map(page => <li key={page.id}><GuideNavLink route={route} path={rulesPathOf(language, page.id)}>{t(page.title)}</GuideNavLink></li>)}
    </ul>
  );
  if (section !== 'codex') return articles.length === 0 ? <p className="px-3 text-sm text-muted">{t('guide.comingSoon')}</p> : <ul className="flex flex-col gap-0.5">{articleLinks}</ul>;
  const openSection = codexSectionOf(route);
  return (
    <ul className="flex flex-col gap-0.5">
      {CODEX_SECTIONS.map(codexSection => (
        <li key={codexSection}>
          <GuideNavLink route={route} path={codexSectionPathOf(language, codexSection)}>{t(codexSection)}</GuideNavLink>
          {codexSection === openSection && (
            <ul className="my-1 ml-3 flex flex-col gap-0.5 border-l border-line pl-2">
              {CODEX_ENTRIES.filter(entry => entry.section === codexSection).map(entry => (
                <li key={entry.id}><GuideNavLink route={route} path={codexEntryPathOf(language, entry)}>{t(entry.name)}</GuideNavLink></li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
