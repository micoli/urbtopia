import './instrument';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { App } from './ui/layout/App';
import { installFpsOverlay, isFpsOverlayRequested } from './ui/system/fpsOverlay';
import { blockPageZoom } from './ui/system/blockPageZoom';
import { hideSplashAfterFailsafe } from './ui/system/splash';
import { installPersistence } from './persistence/install';
import { installErrorRecorder } from './bugReports/recentErrors';
import { cityBucket, installGameMetrics, setGameAttributes } from './monitoring/gameMetrics';
import { installDisplaySettingsMetrics } from './monitoring/displaySettingsMetrics';
import { openCityId } from './persistence/instance';
import { prefsStore } from './i18n/prefsStore';
import { readGpuName } from './bugReports/reportContext';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { installStaleChunkReload } from './pwa/reloadOnStaleChunk';
import { catchUpInChunks } from './store/catchUpInChunks';
import { gameStore, isSimulation } from './store/gameStore';
import { isPromoRequested } from './store/e2eFlag';
import { installEventEffects } from './store/installEventEffects';
import { liveCommandGateway } from './store/liveCommandGateway';
import '@fontsource-variable/inter';
import './styles.css';

installErrorRecorder();
installStaleChunkReload();

const TICK_INTERVAL_MS = 1000;
installEventEffects(liveCommandGateway);
if (!isSimulation) {
  setInterval(() => void catchUpInChunks(Date.now()), TICK_INTERVAL_MS);
  void catchUpInChunks(Date.now());
  const gpu = readGpuName() ?? 'unknown';
  const device = window.matchMedia('(pointer: coarse)').matches ? 'touch' : 'desktop';
  setGameAttributes(() => ({ gpu, device, city_size: cityBucket(gameStore.getState().state.buildings.length), city_id: openCityId() }));
  installPersistence();
  installDisplaySettingsMetrics(prefsStore);
  installGameMetrics();
}

const root = document.getElementById('app');
if (root) createRoot(root, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(<App />);

if (isFpsOverlayRequested(window.location.search)) installFpsOverlay();

if (import.meta.env.DEV && isSimulation) void import('./sim/installSimulation').then((module) => module.installSimulation());

if (import.meta.env.DEV) void import('./devtools/installSkipTime').then((module) => module.installSkipTime());

if (import.meta.env.DEV && isPromoRequested(window.location.search)) void import('./devtools/promo/installPromo').then((module) => module.installPromo());

blockPageZoom();
hideSplashAfterFailsafe();

registerServiceWorker();
