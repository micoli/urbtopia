import { createRoot } from 'react-dom/client';
import { App } from './ui/layout/App';
import { installFpsOverlay, isFpsOverlayRequested } from './ui/system/fpsOverlay';
import { blockPageZoom } from './ui/system/blockPageZoom';
import { hideSplashAfterFailsafe } from './ui/system/splash';
import { installPersistence } from './persistence/install';
import { installErrorRecorder } from './bugReports/recentErrors';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { installStaleChunkReload } from './pwa/reloadOnStaleChunk';
import { catchUpInChunks } from './store/catchUpInChunks';
import { isSimulation } from './store/gameStore';
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
  installPersistence();
}

const root = document.getElementById('app');
if (root) createRoot(root).render(<App />);

if (isFpsOverlayRequested(window.location.search)) installFpsOverlay();

if (import.meta.env.DEV && isSimulation) void import('./sim/installSimulation').then((module) => module.installSimulation());

if (import.meta.env.DEV) void import('./devtools/installSkipTime').then((module) => module.installSkipTime());

blockPageZoom();
hideSplashAfterFailsafe();

registerServiceWorker();
