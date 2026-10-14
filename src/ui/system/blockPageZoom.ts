// iOS Safari ignores user-scalable=no, so its pinch gesture has to be cancelled.
export function blockPageZoom(): void {
  document.addEventListener('gesturestart', event => event.preventDefault());
}
