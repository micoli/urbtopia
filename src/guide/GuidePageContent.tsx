import { CodexEntryPage } from './CodexEntryPage';
import { CodexIndexPage } from './CodexIndexPage';
import { CodexSectionPage } from './CodexSectionPage';
import { GuideHomePage } from './GuideHomePage';
import type { GuideData } from './guideData';
import type { GuideRoute } from './routes';

interface GuidePageContentProps {
  route: GuideRoute;
  data: GuideData;
}

export function GuidePageContent({ route, data }: GuidePageContentProps) {
  const { page } = route;
  if (page.kind === 'codexIndex') return <CodexIndexPage route={route} data={data} />;
  if (page.kind === 'codexSection') return <CodexSectionPage route={route} section={page.section} data={data} />;
  if (page.kind === 'codexEntry') return <CodexEntryPage route={route} id={page.id} data={data} />;
  return <GuideHomePage route={route} />;
}
