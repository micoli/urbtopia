import { GuideLayout } from './GuideLayout';
import { GuidePageContent } from './GuidePageContent';
import { LanguageChoicePage } from './LanguageChoicePage';
import type { GuideData } from './guideData';
import type { GuideRoute } from './routes';

interface GuideAppProps {
  route: GuideRoute;
  data: GuideData;
}

export function GuideApp({ route, data }: GuideAppProps) {
  if (route.page.kind === 'languageChoice') return <LanguageChoicePage />;
  return (
    <GuideLayout route={route}>
      <GuidePageContent route={route} data={data} />
    </GuideLayout>
  );
}
