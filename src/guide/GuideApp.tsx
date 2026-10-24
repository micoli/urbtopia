import { CodexEntryPage } from './CodexEntryPage';
import { GuideHomePage } from './GuideHomePage';
import { GuideLayout } from './GuideLayout';
import { LanguageChoicePage } from './LanguageChoicePage';
import type { GuideData } from './guideData';
import type { GuideRoute } from './routes';

interface GuideAppProps {
  route: GuideRoute;
  data: GuideData;
}

export function GuideApp({ route, data }: GuideAppProps) {
  const { page } = route;
  if (page.kind === 'languageChoice') return <LanguageChoicePage />;
  return (
    <GuideLayout route={route}>
      {page.kind === 'home' ? <GuideHomePage route={route} /> : <CodexEntryPage route={route} id={page.id} data={data} />}
    </GuideLayout>
  );
}
