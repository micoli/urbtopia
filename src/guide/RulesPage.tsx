import type { CodexPage } from '../codex/pages';
import { FixtureLinkContext } from '../ui/codex/fixtureLinkContext';
import { RulesContent } from '../ui/codex/RulesContent';
import { fixturePathOf, hrefOf, type GuideRoute } from './routes';

interface RulesPageProps {
  route: GuideRoute;
  id: CodexPage;
}

export function RulesPage({ route, id }: RulesPageProps) {
  return (
    <article className="guide-rules max-w-4xl">
      <FixtureLinkContext.Provider value={pageId => ({ href: hrefOf(route, fixturePathOf(route.language, pageId)) })}>
        <RulesContent id={id} />
      </FixtureLinkContext.Provider>
    </article>
  );
}
