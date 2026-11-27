import { gameStore } from '../../store/gameStore';
import { sceneHandle } from '../../store/sceneHandle';
import { venueSceneHandle } from '../../store/venueSceneHandle';
import { parseEnvelope } from '../../persistence/envelope';
import { DEMONSTRATIONS } from '../../core/demonstrations/catalog';
import { demonstrationPreferencesStore } from '../../store/demonstrationPreferencesStore';
import './promo.css';

export interface PromoApi {
  loadState(text: string): boolean;
  caption(text: string | null): void;
  timelapse(hours: number, seconds: number): Promise<void>;
  flyTo(x: number, z: number, zoom: number, seconds: number): Promise<void>;
  pinCycleHour(hour: number | null): void;
  tileToScreen(x: number, y: number): { x: number; y: number } | null;
  setUi(parts: string[]): void;
}

declare global {
  interface Window {
    __promo?: PromoApi;
  }
}

const frame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));
const ease = (t: number) => t * t * (3 - 2 * t);

function createElement(className: string): HTMLElement {
  const element = document.createElement('div');
  element.className = className;
  document.body.append(element);
  return element;
}

function installCursor(): void {
  const cursor = createElement('promo-cursor');
  cursor.hidden = true;
  document.addEventListener('mousemove', (event) => {
    cursor.hidden = false;
    cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  }, true);
  document.addEventListener('mousedown', (event) => {
    const ripple = createElement('promo-ripple');
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    ripple.addEventListener('animationend', () => ripple.remove());
  }, true);
}

function installCaption(): (text: string | null) => void {
  const caption = createElement('promo-caption');
  caption.hidden = true;
  return (text) => {
    caption.hidden = text === null;
    caption.textContent = text ?? '';
  };
}

// The Day cycle is lit as Daytime in `?promo` unless a scene asks for the cycle: a time-lapse shows it going round.
function showDayCycle(alwaysDay: boolean, pinnedHour: number | null): void {
  sceneHandle.current?.setDayCycleOverride(alwaysDay, pinnedHour);
}

async function timelapse(hours: number, seconds: number): Promise<void> {
  showDayCycle(false, null);
  const start = performance.now();
  let skipped = 0;
  for (let now = start; now - start < seconds * 1000; now = await frame()) {
    const target = hours * Math.min(1, (now - start) / (seconds * 1000));
    if (target <= skipped) continue;
    gameStore.getState().send({ type: 'SkipTime', hours: target - skipped });
    skipped = target;
  }
  if (hours > skipped) gameStore.getState().send({ type: 'SkipTime', hours: hours - skipped });
  showDayCycle(true, null);
}

async function flyTo(x: number, z: number, zoom: number, seconds: number): Promise<void> {
  const camera = sceneHandle.current?.camera;
  if (!camera) return;
  const from = camera.view;
  const start = performance.now();
  for (let now = start; now - start < seconds * 1000; now = await frame()) {
    const t = ease((now - start) / (seconds * 1000));
    camera.setView({ x: from.x + (x - from.x) * t, z: from.z + (z - from.z) * t, zoom: from.zoom + (zoom - from.zoom) * t });
  }
  camera.setView({ x, z, zoom });
}

function loadState(text: string): boolean {
  const parsed = parseEnvelope(text);
  if (!parsed.ok) return false;
  gameStore.getState().replaceState(parsed.state);
  return true;
}

// An open interior covers the map: the cell is looked for there first.
function tileToScreen(x: number, y: number): { x: number; y: number } | null {
  if (venueSceneHandle.current) return venueSceneHandle.current.screenOfCell(x, y);
  const point = sceneHandle.current?.project(x + 0.5, 0.4, y + 0.5);
  return point?.visible ? { x: point.x, y: point.y } : null;
}

function setUi(parts: string[]): void {
  document.documentElement.dataset.promoShow = parts.join(' ');
}

// The guided demonstrations explain the game: a promo never opens their invitation.
function silenceDemonstrations(): void {
  const types = DEMONSTRATIONS.map((demonstration) => demonstration.buildingType);
  demonstrationPreferencesStore.setState({ seenTypes: types });
}

export function installPromo(): void {
  setUi([]);
  silenceDemonstrations();
  installCursor();
  const caption = installCaption();
  window.__promo = { loadState, caption, timelapse, flyTo, pinCycleHour: (hour) => showDayCycle(hour === null, hour), tileToScreen, setUi };
}
