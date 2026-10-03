import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { installFpsOverlay, isFpsOverlayRequested } from './ui/fpsOverlay';
import { hideSplashAfterFailsafe } from './ui/splash';
import { installPersistence } from './persistence/install';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { gameStore, isSimulation } from './store/gameStore';
import './styles.css';

const TICK_INTERVAL_MS = 1000;
if (!isSimulation) {
  setInterval(() => gameStore.getState().tick(Date.now()), TICK_INTERVAL_MS);
  gameStore.getState().tick(Date.now());
  installPersistence();
}

const root = document.getElementById('app');
if (root) createRoot(root).render(<App />);

if (isFpsOverlayRequested(window.location.search)) installFpsOverlay();

if (import.meta.env.DEV && isSimulation) void import('./sim/installSimulation').then((module) => module.installSimulation());

hideSplashAfterFailsafe();

registerServiceWorker();
