import { renderToString } from 'react-dom/server';
import type { CodexManifest } from '../codex/catalog';
import { prefsStore } from '../i18n/prefsStore';
import { GuideApp } from './GuideApp';
import { guideDataOf, type GuideData } from './guideData';
import type { GuideRoute } from './routes';
import { titleOf } from './titleOf';

export { GUIDE_ROUTES, docsRootOf } from './routes';

export interface RenderedGuidePage {
  html: string;
  title: string;
  data: GuideData;
}

export function renderGuidePage(route: GuideRoute, manifest: CodexManifest): RenderedGuidePage {
  prefsStore.setState({ language: route.language });
  const data = guideDataOf(route, manifest);
  return { html: renderToString(<GuideApp route={route} data={data} />), title: titleOf(route), data };
}
