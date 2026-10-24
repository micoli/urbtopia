import { CODEX_ENTRIES } from '../codex/catalog';
import { t } from '../i18n/t';
import { GUIDE_ROUTES, GUIDE_SECTIONS, hrefOf, sectionOf, type GuideRoute } from './routes';
import { titleOf } from './titleOf';

interface GuideNavProps {
  route: GuideRoute;
}

function labelOf(route: GuideRoute): string {
  const { page } = route;
  if (page.kind === 'codexEntry') return t(CODEX_ENTRIES.find(entry => entry.id === page.id)!.name);
  return titleOf(route);
}

export function GuideNav({ route }: GuideNavProps) {
  const routes = GUIDE_ROUTES.filter(item => item.language === route.language);
  return (
    <nav aria-label={t('guide.navigation')} className="flex flex-col gap-6">
      {GUIDE_SECTIONS.map(section => {
        const links = routes.filter(item => sectionOf(item) === section.id);
        return (
          <section key={section.id}>
            <h2 className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted uppercase">{t(section.title)}</h2>
            {links.length === 0
              ? <p className="px-3 text-sm text-muted">{t('guide.comingSoon')}</p>
              : <ul className="flex flex-col gap-0.5">
                {links.map(item => (
                  <li key={item.path}>
                    <a className="guide-nav-link" href={hrefOf(route, item.path)} aria-current={item.path === route.path ? 'page' : undefined}>{labelOf(item)}</a>
                  </li>
                ))}
              </ul>}
          </section>
        );
      })}
    </nav>
  );
}
