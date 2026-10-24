import { CODEX_ENTRIES } from '../codex/catalog';
import { t } from '../i18n/t';
import { GUIDE_ROUTES, hrefOf, type GuideRoute } from './routes';

interface GuideHomePageProps {
  route: GuideRoute;
}

export function GuideHomePage({ route }: GuideHomePageProps) {
  const links = GUIDE_ROUTES.flatMap(item => item.language === route.language && item.page.kind === 'codexEntry' ? [{ path: item.path, id: item.page.id }] : []);
  return (
    <main className="guide-page">
      <h1>{t('guide.name')}</h1>
      <p>{t('guide.intro')}</p>
      <h2>{t('guide.codex')}</h2>
      <ul className="guide-links">
        {links.map(({ path, id }) => <li key={path}><a href={hrefOf(route, path)}>{t(CODEX_ENTRIES.find(entry => entry.id === id)!.name)}</a></li>)}
      </ul>
    </main>
  );
}
