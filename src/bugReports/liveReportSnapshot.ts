import { readRegistry } from '../persistence/cities';
import { openCityId, rawSaveStore } from '../persistence/instance';
import { exportEnvelope } from '../persistence/transfer';
import { gameStore } from '../store/gameStore';
import { sceneHandle } from '../store/sceneHandle';
import { uiStore } from '../store/uiStore';
import { readCameraPose, type CameraPose } from './cameraPose';
import { encodeCanvas } from './encodeImage';
import { withTimeout } from './withTimeout';

// A page the browser does not paint (a hidden tab) never finishes: the whole-screen capture is then given up.
const SCREEN_CAPTURE_TIMEOUT_MS = 4000;

// Everything a Bug report can carry, frozen at one moment.
export interface ReportSnapshot {
  map: string | null;
  screen: string | null;
  pose: CameraPose | null;
  cityText: string;
  cityId: string;
  citySeed: string;
}

export async function captureReportSnapshot(now = Date.now()): Promise<ReportSnapshot> {
  const scene = sceneHandle.current;
  const gameCanvas = scene?.renderedCanvas() ?? null;
  const mapCanvas = gameCanvas ? copyOf(gameCanvas) : null;
  const pose = scene ? readCameraPose(scene.camera, uiStore.getState().level) : null;
  const { state } = gameStore.getState();
  const cityId = openCityId();
  const cityName = readRegistry(rawSaveStore)?.cities.find((entry) => entry.id === cityId)?.name ?? null;
  const cityText = exportEnvelope(state, now, cityName);
  const map = mapCanvas ? encodeCanvas(mapCanvas) : null;
  const screen = mapCanvas ? await captureScreen(mapCanvas, gameCanvas) : null;
  return { map, screen, pose, cityText, cityId, citySeed: String(state.seed) };
}

function copyOf(source: HTMLCanvasElement): HTMLCanvasElement {
  const copy = document.createElement('canvas');
  copy.width = source.width;
  copy.height = source.height;
  copy.getContext('2d')?.drawImage(source, 0, 0);
  return copy;
}

// The map is copied first and the page drawn around it: the WebGL canvas cannot be read by a DOM renderer.
async function captureScreen(map: HTMLCanvasElement, gameCanvas: HTMLCanvasElement | null): Promise<string | null> {
  try {
    const { toCanvas } = await import('html-to-image');
    const page = await withTimeout(
      toCanvas(document.documentElement, { pixelRatio: 1, cacheBust: false, filter: (node) => node !== gameCanvas }),
      SCREEN_CAPTURE_TIMEOUT_MS,
    );
    if (!page) return null;
    const composed = document.createElement('canvas');
    composed.width = page.width;
    composed.height = page.height;
    const context = composed.getContext('2d');
    if (!context) return null;
    context.drawImage(map, 0, 0, page.width, page.height);
    context.drawImage(page, 0, 0);
    return encodeCanvas(composed);
  } catch {
    return null;
  }
}
