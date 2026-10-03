const WINDOW_MS = 1000;

export function isFpsOverlayRequested(search: string): boolean {
  return new URLSearchParams(search).has('fps');
}

export function installFpsOverlay(): void {
  const element = document.createElement('div');
  element.className = 'fps-overlay';
  document.body.appendChild(element);

  let windowStart = performance.now();
  let lastFrame = windowStart;
  let frames = 0;
  let worstFrameMs = 0;
  let minFps = Infinity;
  let sessionFrames = 0;
  let sessionStart = windowStart;

  const onFrame = (now: number): void => {
    requestAnimationFrame(onFrame);
    frames++;
    sessionFrames++;
    worstFrameMs = Math.max(worstFrameMs, now - lastFrame);
    lastFrame = now;

    const elapsed = now - windowStart;
    if (elapsed < WINDOW_MS) return;

    const fps = (frames * 1000) / elapsed;
    minFps = Math.min(minFps, fps);
    const sessionAvg = (sessionFrames * 1000) / (now - sessionStart);
    element.textContent = `${fps.toFixed(0)} fps | min ${minFps.toFixed(0)} | avg ${sessionAvg.toFixed(0)} | worst ${worstFrameMs.toFixed(0)} ms`;
    windowStart = now;
    frames = 0;
    worstFrameMs = 0;
  };

  element.addEventListener('click', () => {
    minFps = Infinity;
    sessionFrames = 0;
    sessionStart = performance.now();
  });

  requestAnimationFrame(onFrame);
}
