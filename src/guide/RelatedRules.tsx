import type { CodexSection } from '../codex/catalog';
import { CODEX_PAGES } from '../codex/pages';
import { t } from '../i18n/t';
import { hrefOf, rulesPathOf, type GuideRoute } from './routes';

interface RelatedRulesProps {
  route: GuideRoute;
  section: CodexSection;
}

export function RelatedRules({ route, section }: RelatedRulesProps) {
  const pages = CODEX_PAGES.filter(page => page.section === section);
  if (pages.length === 0) return null;
  return (
    <aside className="mt-10">
      <h2>{t('guide.mechanics')}</h2>
      <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
        {pages.map(page => (
          <li key={page.id}>
            <a className="guide-card flex flex-col gap-1" href={hrefOf(route, rulesPathOf(route.language, page.id))}>
              {t(page.title)}
              <span className="line-clamp-2 text-sm font-normal text-muted">{t(page.description)}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
