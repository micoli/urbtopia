// iOS and macOS Safari ignore user-scalable=no, so their pinch gesture has to be cancelled.
// Other desktop browsers report a trackpad pinch as a wheel event with ctrlKey set.
export function blockPageZoom(): void {
  document.addEventListener('gesturestart', event => event.preventDefault());
  document.addEventListener('wheel', event => {
    if (event.ctrlKey) event.preventDefault();
  }, { passive: false });
}
