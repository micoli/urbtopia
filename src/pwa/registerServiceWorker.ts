import { dialogStore } from '../store/dialogStore';
import { exportCurrentCity } from '../persistence/exportCity';

const UPDATE_CHECK_MS = 60 * 1000;

// Registers the service worker, checks for a new build every minute and when the app comes back to the foreground,
// and asks the player to reload once a new build is ready.
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  const hadController = navigator.serviceWorker.controller !== null;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    exportCurrentCity();
    dialogStore.getState().setUpdateReady(true);
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
      .then((registration) => {
        const check = () => registration.update().catch(() => {});
        setInterval(check, UPDATE_CHECK_MS);
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) check();
        });
      })
      .catch(() => {});
  });
}
