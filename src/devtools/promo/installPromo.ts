import { gameStore } from '../../store/gameStore';
import { sceneHandle } from '../../store/sceneHandle';
import { venueSceneHandle } from '../../store/venueSceneHandle';
import { parseEnvelope } from '../../persistence/envelope';
import { DEMONSTRATIONS } from '../../core/demonstrations/catalog';
import { demonstrationPreferencesStore } from '../../store/demonstrationPreferencesStore';
import './promo.css';

export interface PromoApi {
  loadState(text: string): boolean;
  timelapse(hours: number, seconds: number): Promise<void>;
  flyTo(x: number, z: number, zoom: number, seconds: number): Promise<void>;
  pinCycleHour(hour: number | null): void;
  tileToScreen(x: number, y: number): { x: number; y: number } | null;
  setUi(parts: string[]): void;
  caption(text: string | null, mode?: CaptionMode): void;
  title(text: string | null, subtitle?: string): void;
  callout(rect: Rect | null, label?: string): void;
  stat(label: string, from: number, to: number, seconds: number, suffix?: string): Promise<void>;
  look(on: boolean): void;
  shiftRoom(dx: number, dy: number): void;
}

export type CaptionMode = 'plain' | 'words' | 'typewriter';
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
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

function installCaption(): (text: string | null, mode?: CaptionMode) => void {
  const caption = createElement('promo-caption');
  caption.hidden = true;
  let typing: number | undefined;
  return (text, mode = 'plain') => {
    window.clearInterval(typing);
    caption.hidden = text === null;
    caption.replaceChildren();
    caption.classList.toggle('promo-typewriter', mode === 'typewriter');
    if (text === null) return;
    if (mode === 'plain') {
      caption.textContent = text;
      return;
    }
    if (mode === 'typewriter') {
      let shown = 0;
      typing = window.setInterval(() => {
        shown += 1;
        caption.textContent = text.slice(0, shown);
        if (shown >= text.length) window.clearInterval(typing);
      }, 45);
      return;
    }
    // The space is a text node between the words: a space at the end of an inline-block would collapse.
    text.split(' ').forEach((word, index) => {
      const span = document.createElement('span');
      span.className = 'promo-word';
      span.style.animationDelay = `${index * 90}ms`;
      span.textContent = word;
      if (index > 0) caption.append(' ');
      caption.append(span);
    });
  };
}

// A full-screen title card: the text goes from blur to sharp over a radial glow.
function installTitle(): (text: string | null, subtitle?: string) => void {
  const card = createElement('promo-title');
  card.hidden = true;
  return (text, subtitle) => {
    card.hidden = text === null;
    card.replaceChildren();
    if (text === null) return;
    const heading = document.createElement('h1');
    heading.textContent = text;
    card.append(heading);
    if (!subtitle) return;
    const line = document.createElement('p');
    line.textContent = subtitle;
    card.append(line);
  };
}

// A spotlight: everything but the rectangle is dimmed, and a ring pulses around it.
function installCallout(): (rect: Rect | null, label?: string) => void {
  const callout = createElement('promo-callout');
  callout.hidden = true;
  return (rect, label) => {
    callout.hidden = rect === null;
    callout.replaceChildren();
    if (rect === null) return;
    const margin = 10;
    Object.assign(callout.style, { left: `${rect.x - margin}px`, top: `${rect.y - margin}px`, width: `${rect.width + margin * 2}px`, height: `${rect.height + margin * 2}px` });
    if (!label) return;
    const tag = document.createElement('span');
    tag.textContent = label;
    // A label wider than the room beside the ring stays inside the picture.
    if (rect.x + rect.width / 2 < window.innerWidth * 0.15) Object.assign(tag.style, { left: '0', transform: 'none' });
    callout.append(tag);
  };
}

// A figure that counts up in the middle of the screen, with a small pulse when it lands.
function installStat(): PromoApi['stat'] {
  const stat = createElement('promo-stat');
  stat.hidden = true;
  return async (label, from, to, seconds, suffix = '') => {
    stat.hidden = false;
    const start = performance.now();
    for (let now = start; now - start < seconds * 1000; now = await frame()) {
      const t = 1 - Math.pow(1 - (now - start) / (seconds * 1000), 3);
      stat.replaceChildren(Object.assign(document.createElement('strong'), { textContent: `${Math.round(from + (to - from) * t).toLocaleString('en-US')}${suffix}` }), Object.assign(document.createElement('span'), { textContent: label }));
    }
    stat.replaceChildren(Object.assign(document.createElement('strong'), { textContent: `${to.toLocaleString('en-US')}${suffix}`, className: 'promo-pulse' }), Object.assign(document.createElement('span'), { textContent: label }));
    await new Promise((resolve) => setTimeout(resolve, 1200));
    stat.hidden = true;
  };
}

// A light vignette and a faint grain over the whole picture.
function look(on: boolean): void {
  document.documentElement.dataset.promoLook = on ? 'on' : 'off';
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

// Moves the open room on the screen by a number of pixels: the pan is in world units, so the way a pan moves the picture is measured first.
function shiftRoom(dx: number, dy: number): void {
  const scene = venueSceneHandle.current;
  if (!scene) return;
  const view = scene.getView();
  const at = () => scene.screenOfCell(5, 5);
  const origin = at();
  scene.setView(view.x + 1, view.y, view.zoom);
  const alongX = { x: at().x - origin.x, y: at().y - origin.y };
  scene.setView(view.x, view.y + 1, view.zoom);
  const alongY = { x: at().x - origin.x, y: at().y - origin.y };
  const determinant = alongX.x * alongY.y - alongY.x * alongX.y;
  if (Math.abs(determinant) < 1e-6) return scene.setView(view.x, view.y, view.zoom);
  const tx = (dx * alongY.y - alongY.x * dy) / determinant;
  const ty = (alongX.x * dy - dx * alongX.y) / determinant;
  scene.setView(view.x + tx, view.y + ty, view.zoom);
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
  window.__promo = { loadState, caption: installCaption(), title: installTitle(), callout: installCallout(), stat: installStat(), look, shiftRoom, timelapse, flyTo, pinCycleHour: (hour) => showDayCycle(hour === null, hour), tileToScreen, setUi };
  look(true);
}
