import * as THREE from 'three';
import { keyDirectionForYaw } from './cameraKeys';

const ISO_PITCH = Math.atan(1 / Math.SQRT2);
const ZOOM_MIN = 16;
const ZOOM_MAX = 90;
const TWIST_SNAP = (35 * Math.PI) / 180;
const KEY_PAN_SPEED = 14;
const KEY_HOLD_DELAY = 0.3;
const KEY_DIRECTIONS: Record<string, { x: number; z: number }> = {
  arrowup: { x: 0, z: -1 },
  w: { x: 0, z: -1 },
  arrowdown: { x: 0, z: 1 },
  s: { x: 0, z: 1 },
  arrowleft: { x: -1, z: 0 },
  a: { x: -1, z: 0 },
  arrowright: { x: 1, z: 0 },
  d: { x: 1, z: 0 },
};
const YAW_EASING = 12;
const TAP_SLOP_PX = 8;
const TAP_MAX_MS = 400;

export class CameraController {
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -500, 500);
  private focus = { x: 64, z: 64 };
  private zoom = 36;
  private yaw = Math.PI / 4;
  private yawTarget = Math.PI / 4;
  private pointers = new Map<number, { x: number; y: number }>();
  private lastPinchDistance = 0;
  private lastPinchAngle = 0;
  private twist = 0;
  private keys = new Map<string, number>();
  private gesture = { startX: 0, startY: 0, startTime: 0, moved: false, multiTouch: false };
  private pendingTap: { x: number; y: number; shiftKey: boolean } | null = null;
  onTap: (clientX: number, clientY: number, shiftKey: boolean) => void = () => {};
  onMouseMove: (clientX: number, clientY: number) => void = () => {};
  onPointerKind: (pointerType: string) => void = () => {};
  onSecondaryClick: () => void = () => {};
  onGrabStart: (clientX: number, clientY: number) => boolean = () => false;
  onGrabMove: (clientX: number, clientY: number) => void = () => {};
  onBrushStart: (clientX: number, clientY: number) => void = () => {};
  onBrushMove: (clientX: number, clientY: number) => void = () => {};
  onBrushEnd: () => void = () => {};
  onBrushCancel: () => void = () => {};
  brushMode = false;
  private brushPointer: number | null = null;
  private grabPointer: number | null = null;
  private abort = new AbortController();

  constructor(
    private canvas: HTMLCanvasElement,
    private bounds: { min: number; max: number },
  ) {
    this.bindInput();
    this.apply();
  }

  get center(): { x: number; z: number } {
    return { ...this.focus };
  }

  focusOn(x: number, z: number): void {
    this.focus = { x, z };
    this.clampFocus();
    this.apply();
  }

  rotate(quarterTurns: number): void {
    this.yawTarget += (quarterTurns * Math.PI) / 2;
  }

  resize(): void {
    this.apply();
  }

  update(deltaSeconds: number): void {
    this.applyKeys(deltaSeconds);
    const difference = this.yawTarget - this.yaw;
    if (Math.abs(difference) > 1e-4) {
      this.yaw += difference * Math.min(1, YAW_EASING * deltaSeconds);
      this.apply();
    }
  }

  dispose(): void {
    this.abort.abort();
  }

  private panByScreen(dx: number, dy: number): void {
    const scale = 1 / this.zoom;
    const cos = Math.cos(this.yaw);
    const sin = Math.sin(this.yaw);
    this.focus.x -= (dx * cos + dy * sin * Math.SQRT2) * scale;
    this.focus.z -= (-dx * sin + dy * cos * Math.SQRT2) * scale;
    this.clampFocus();
    this.apply();
  }

  private applyKeys(deltaSeconds: number): void {
    let x = 0;
    let z = 0;
    for (const [key, heldSeconds] of this.keys) {
      this.keys.set(key, heldSeconds + deltaSeconds);
      const direction = this.keyDirection(key);
      if (!direction || heldSeconds < KEY_HOLD_DELAY) continue;
      x += direction.x;
      z += direction.z;
    }
    if (!x && !z) return;
    const step = (KEY_PAN_SPEED * deltaSeconds) / Math.hypot(x, z);
    this.moveFocus(x * step, z * step);
  }

  private keyDirection(key: string): { x: number; z: number } | undefined {
    const direction = KEY_DIRECTIONS[key];
    return direction && keyDirectionForYaw(direction, this.yawTarget);
  }

  private moveFocus(x: number, z: number): void {
    this.focus.x += x;
    this.focus.z += z;
    this.clampFocus();
    this.apply();
  }

  private zoomBy(factor: number): void {
    this.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.zoom * factor));
    this.apply();
  }

  private clampFocus(): void {
    this.focus.x = Math.min(this.bounds.max, Math.max(this.bounds.min, this.focus.x));
    this.focus.z = Math.min(this.bounds.max, Math.max(this.bounds.min, this.focus.z));
  }

  private apply(): void {
    const { camera, canvas, zoom, yaw, focus } = this;
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    camera.left = -width / zoom / 2;
    camera.right = width / zoom / 2;
    camera.top = height / zoom / 2;
    camera.bottom = -height / zoom / 2;
    const distance = 100;
    camera.position.set(
      focus.x + Math.sin(yaw) * Math.cos(ISO_PITCH) * distance,
      Math.sin(ISO_PITCH) * distance,
      focus.z + Math.cos(yaw) * Math.cos(ISO_PITCH) * distance,
    );
    camera.lookAt(focus.x, 0, focus.z);
    camera.updateProjectionMatrix();
  }

  private bindInput(): void {
    const { signal } = this.abort;
    const { canvas } = this;
    canvas.addEventListener('pointerdown', (event) => this.onPointerDown(event), { signal });
    canvas.addEventListener('pointermove', (event) => this.onPointerMove(event), { signal });
    canvas.addEventListener('pointerup', (event) => this.onPointerEnd(event), { signal });
    canvas.addEventListener('pointercancel', (event) => this.onPointerEnd(event), { signal });
    canvas.addEventListener('click', () => this.onClick(), { signal });
    canvas.addEventListener('contextmenu', (event) => this.onContextMenu(event), { signal });
    canvas.addEventListener('wheel', (event) => this.zoomBy(event.deltaY < 0 ? 1.1 : 0.9), { signal, passive: true });
    window.addEventListener('keydown', (event) => this.onKey(event, true), { signal });
    window.addEventListener('keyup', (event) => this.onKey(event, false), { signal });
    window.addEventListener('blur', () => this.keys.clear(), { signal });
  }

  private onKey(event: KeyboardEvent, pressed: boolean): void {
    if (pressed && event.target instanceof HTMLElement && event.target.closest('[role="dialog"]')) return;
    const key = event.key.toLowerCase();
    if (pressed && key === 'q') return this.rotate(-1);
    if (pressed && key === 'e') return this.rotate(1);
    if (!pressed) {
      this.keys.delete(key);
      return;
    }
    const direction = this.keyDirection(key);
    if (!direction || event.repeat || this.keys.has(key)) return;
    this.keys.set(key, 0);
    this.moveFocus(direction.x, direction.z);
  }

  private onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.onSecondaryClick();
  }

  private onPointerDown(event: PointerEvent): void {
    this.pendingTap = null;
    this.onPointerKind(event.pointerType);
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointers cannot be captured; gestures still work without capture.
    }
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.lastPinchDistance = 0;
    this.twist = 0;
    if (this.grabPointer !== null) this.grabPointer = null;
    if (!this.brushMode && event.pointerType !== 'mouse' && this.pointers.size === 1 && this.onGrabStart(event.clientX, event.clientY)) this.grabPointer = event.pointerId;
    if (this.brushMode && this.pointers.size === 1) {
      this.brushPointer = event.pointerId;
      this.onBrushStart(event.clientX, event.clientY);
    } else if (this.brushPointer !== null) {
      this.brushPointer = null;
      this.onBrushCancel();
    }
    if (this.pointers.size === 1) {
      this.gesture = { startX: event.clientX, startY: event.clientY, startTime: performance.now(), moved: false, multiTouch: false };
    } else {
      this.gesture.multiTouch = true;
    }
  }

  private onPointerEnd(event: PointerEvent): void {
    const wasSingle = this.pointers.size === 1 && event.type === 'pointerup';
    const { startX, startY, startTime, moved, multiTouch } = this.gesture;
    const wasBrush = this.brushPointer === event.pointerId;
    const wasGrab = this.grabPointer === event.pointerId;
    if (wasGrab) this.grabPointer = null;
    const isTap = !wasBrush && !wasGrab && wasSingle && !moved && !multiTouch && performance.now() - startTime < TAP_MAX_MS;
    this.pointers.delete(event.pointerId);
    if (wasBrush) {
      this.brushPointer = null;
      if (event.type === 'pointerup') this.onBrushEnd();
      else this.onBrushCancel();
    }
    this.pendingTap = isTap ? { x: startX, y: startY, shiftKey: event.shiftKey } : null;
    this.lastPinchDistance = 0;
    this.twist = 0;
  }

  private onClick(): void {
    const tap = this.pendingTap;
    this.pendingTap = null;
    if (!tap) return;
    this.onTap(tap.x, tap.y, tap.shiftKey);
  }

  private onPointerMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.onPointerKind(event.pointerType);
      this.onMouseMove(event.clientX, event.clientY);
    }
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    if (this.brushPointer === event.pointerId) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      return this.onBrushMove(event.clientX, event.clientY);
    }
    if (Math.hypot(event.clientX - this.gesture.startX, event.clientY - this.gesture.startY) > TAP_SLOP_PX) this.gesture.moved = true;
    if (this.grabPointer === event.pointerId) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      return this.onGrabMove(event.clientX, event.clientY);
    }
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (this.pointers.size === 1) return this.panByScreen(dx, dy);
    if (this.pointers.size === 2) this.onTwoFingers();
  }

  private onTwoFingers(): void {
    const [a, b] = [...this.pointers.values()];
    if (!a || !b) return;
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    if (this.lastPinchDistance) {
      this.zoomBy(distance / this.lastPinchDistance);
      this.twist += normalizeAngle(angle - this.lastPinchAngle);
    }
    this.lastPinchDistance = distance;
    this.lastPinchAngle = angle;
    if (Math.abs(this.twist) < TWIST_SNAP) return;
    this.rotate(this.twist > 0 ? -1 : 1);
    this.twist = 0;
  }
}

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
