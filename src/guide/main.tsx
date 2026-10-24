import { createRoot, hydrateRoot } from 'react-dom/client';
import { validateCodexManifest, type CodexManifest } from '../codex/catalog';
import { prefsStore } from '../i18n/prefsStore';
import { GuideApp } from './GuideApp';
import { guideDataOf, type GuideData } from './guideData';
import { gameRootOf, guideRouteOf } from './routes';
import { titleOf } from './titleOf';
import './guide.css';

const route = guideRouteOf(location.pathname);
const container = document.getElementById('guide')!;

async function fetchedData(): Promise<GuideData> {
  const response = await fetch(`${gameRootOf(route)}codex/manifest.json`);
  const manifest = await response.json() as CodexManifest;
  validateCodexManifest(manifest);
  return guideDataOf(route, manifest);
}

async function start(): Promise<void> {
  if (route.page.kind === 'languageChoice') return location.replace(`${location.pathname.replace(/\/docs\/.*$/, '/docs/')}${prefsStore.getState().language}/`);
  prefsStore.setState({ language: route.language });
  const embedded = document.getElementById('guide-data')?.textContent;
  if (embedded) {
    hydrateRoot(container, <GuideApp route={route} data={JSON.parse(embedded) as GuideData} />);
    return;
  }
  document.title = titleOf(route);
  createRoot(container).render(<GuideApp route={route} data={await fetchedData()} />);
}

void start();
