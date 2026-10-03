const UPDATE_CHECK_MS = 60 * 60 * 1000;

// Registers the service worker, checks for a new build every hour and when the app comes back to the foreground,
// and reloads onto the new build once the app is in the background so a session is never interrupted.
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  const hadController = navigator.serviceWorker.controller !== null;
  let updateReady = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    updateReady = true;
    if (document.hidden) window.location.reload();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && updateReady) window.location.reload();
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
