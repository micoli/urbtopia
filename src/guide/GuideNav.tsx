import { CODEX_ENTRIES, CODEX_SECTIONS } from '../codex/catalog';
import { t } from '../i18n/t';
import { GuideNavLink } from './GuideNavLink';
import { codexEntryPathOf, codexSectionOf, codexSectionPathOf, GUIDE_SECTIONS, type GuideRoute } from './routes';

interface GuideNavProps {
  route: GuideRoute;
}

export function GuideNav({ route }: GuideNavProps) {
  const { language } = route;
  const openSection = codexSectionOf(route);
  return (
    <nav aria-label={t('guide.navigation')} className="flex flex-col gap-6">
      {GUIDE_SECTIONS.map(section => (
        <section key={section.id}>
          <h2 className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted uppercase">{t(section.title)}</h2>
          {section.id === 'codex'
            ? <ul className="flex flex-col gap-0.5">
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
            : <p className="px-3 text-sm text-muted">{t('guide.comingSoon')}</p>}
        </section>
      ))}
    </nav>
  );
}
