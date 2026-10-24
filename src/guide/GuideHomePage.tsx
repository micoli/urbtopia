import { t } from '../i18n/t';
import { GUIDE_ROUTES, GUIDE_SECTIONS, hrefOf, sectionOf, type GuideRoute } from './routes';

interface GuideHomePageProps {
  route: GuideRoute;
}

export function GuideHomePage({ route }: GuideHomePageProps) {
  const routes = GUIDE_ROUTES.filter(item => item.language === route.language);
  return (
    <article className="max-w-3xl">
      <h1>{t('guide.name')}</h1>
      <p className="text-lg text-muted">{t('guide.intro')}</p>
      <ul className="mt-10 grid list-none gap-4 p-0 sm:grid-cols-2">
        {GUIDE_SECTIONS.map(section => {
          const first = routes.find(item => sectionOf(item) === section.id);
          return (
            <li key={section.id}>
              {first
                ? <a className="guide-card" href={hrefOf(route, first.path)}>{t(section.title)}</a>
                : <span className="guide-card opacity-60">{t(section.title)} · {t('guide.comingSoon')}</span>}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
