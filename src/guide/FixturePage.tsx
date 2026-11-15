import { fixturePageOf } from '../codex/fixturePages';
import { FixturePageContent } from '../ui/codex/FixturePageContent';
import { hrefOf, rulesPathOf, type GuideRoute } from './routes';
import { t } from '../i18n/t';

interface FixturePageProps {
  route: GuideRoute;
  id: string;
}

export function FixturePage({ route, id }: FixturePageProps) {
  return (
    <article className="guide-rules max-w-4xl">
      <p><a href={hrefOf(route, rulesPathOf(route.language, 'fixtures'))}>{t('codex.fixtures.all')}</a></p>
      <FixturePageContent page={fixturePageOf(id)!} />
    </article>
  );
}
