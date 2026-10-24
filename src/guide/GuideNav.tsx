import { t } from '../i18n/t';
import { GuideNavSection } from './GuideNavSection';
import { GUIDE_SECTIONS, type GuideRoute } from './routes';

interface GuideNavProps {
  route: GuideRoute;
}

export function GuideNav({ route }: GuideNavProps) {
  return (
    <nav aria-label={t('guide.navigation')} className="flex flex-col gap-6">
      {GUIDE_SECTIONS.map(section => (
        <section key={section.id}>
          <h2 className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted uppercase">{t(section.title)}</h2>
          <GuideNavSection route={route} section={section.id} />
        </section>
      ))}
    </nav>
  );
}
