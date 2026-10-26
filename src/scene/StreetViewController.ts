import * as THREE from 'three';
import type { PedestrianGraph } from '../core';
import { isTypingTarget } from '../dom/isTypingTarget';
import type { ElevationAt } from './bridgeElevation';
import { nodePosition, tileOfNode } from './pedestrianWalk';
import { EYE_HEIGHT, crossingSightings, jumpPaths, nearestNode, nextJump, normalizeAngle, type Sighting } from './streetNavigation';

const FOV = 70;
const NEAR = 0.02;
const FAR = 60;
const WALK_SPEED = 1.8;
const TURN_SPEED = 1.6;
const LOOK_SPEED = 0.005;
const PITCH_LIMIT = (60 * Math.PI) / 180;
const TAP_SLOP_PX = 8;
const TAP_MAX_MS = 400;
const TAP_RADIUS_PX = 56;
const MARKER_LIFT = 0.06;
const MAX_MARKERS = 16;
const MARKER_GROWTH_DISTANCE = 4;
const MARKER_MAX_SCALE = 2.5;
const DROP_REACH = 6;

const FORWARD_KEYS = new Set(['arrowup', 'w', 'z']);
const BACKWARD_KEYS = new Set(['arrowdown', 's']);
const LEFT_KEYS = new Set(['arrowleft', 'a', 'q']);
const RIGHT_KEYS = new Set(['arrowright', 'd', 'e']);

interface Step {
  from: string;
  to: string;
  length: number;
  progress: number;
}

const flat: ElevationAt = () => 0;

export class StreetViewController {
  readonly camera = new THREE.PerspectiveCamera(FOV, 1, NEAR, FAR);
  readonly markers = new THREE.Group();
  onExit: () => void = () => {};
  private graph: PedestrianGraph = new Map();
  private elevation: ElevationAt = flat;
  private node: string | null = null;
  private step: Step | null = null;
  private queue: string[] = [];
  private sightings: Sighting[] = [];
  private sightingsFor: string | null = null;
  private sightingsGraph: PedestrianGraph | null = null;
  private frustum = new THREE.Frustum();
  private projection = new THREE.Matrix4();
  private yaw = 0;
  private pitch = 0;
  private held = new Set<string>();
  private drag: { pointerId: number; x: number; y: number; startX: number; startY: number; startTime: number; moved: boolean } | null = null;
  private abort: AbortController | null = null;
  private markerMeshes: THREE.Mesh[];

  constructor(private canvas: HTMLCanvasElement) {
    this.camera.rotation.order = 'YXZ';
    const geometry = new THREE.RingGeometry(0.1, 0.16, 24).rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthTest: false });
    this.markerMeshes = Array.from({ length: MAX_MARKERS }, () => new THREE.Mesh(geometry, material));
    this.markerMeshes.forEach((mesh) => (mesh.renderOrder = 10));
    this.markers.add(...this.markerMeshes);
    this.markers.visible = false;
  }

  get active(): boolean {
    return this.abort !== null;
  }

  enter(graph: PedestrianGraph, elevation: ElevationAt, x: number, z: number, yaw: number): boolean {
    this.setWorld(graph, elevation);
    const start = nearestNode(graph, x, z, DROP_REACH);
    if (start === null) return false;
    this.node = start;
    this.step = null;
    this.queue = [];
    this.yaw = yaw;
    this.pitch = 0;
    this.bindInput();
    this.markers.visible = true;
    this.resize();
    this.place();
    return true;
  }

  exit(): void {
    this.abort?.abort();
    this.abort = null;
    this.held.clear();
    this.drag = null;
    this.markers.visible = false;
  }

  setWorld(graph: PedestrianGraph, elevation: ElevationAt): void {
    this.graph = graph;
    this.elevation = elevation;
    if (!this.active || this.node === null || graph.has(this.node)) return;
    const here = nodePosition(this.node);
    this.node = nearestNode(graph, here.x, here.z);
    this.step = null;
    this.queue = [];
  }

  resize(): void {
    this.camera.aspect = (this.canvas.clientWidth || 1) / (this.canvas.clientHeight || 1);
    this.camera.updateProjectionMatrix();
  }

  update(deltaSeconds: number): void {
    if (!this.active || this.node === null) return;
    this.turn(deltaSeconds);
    this.advance(deltaSeconds);
    this.place();
  }

  dispose(): void {
    this.exit();
    this.markerMeshes[0]?.geometry.dispose();
    (this.markerMeshes[0]?.material as THREE.Material | undefined)?.dispose();
  }

  private turn(deltaSeconds: number): void {
    const direction = Number(this.holdsAny(LEFT_KEYS)) - Number(this.holdsAny(RIGHT_KEYS));
    this.yaw = normalizeAngle(this.yaw + direction * TURN_SPEED * deltaSeconds);
  }

  private advance(deltaSeconds: number): void {
    if (this.step) {
      this.step.progress += (WALK_SPEED * deltaSeconds) / this.step.length;
      if (this.step.progress < 1) return;
      this.node = this.step.to;
      this.step = null;
    }
    if (this.node === null) return;
    const following = this.queue.shift();
    if (following !== undefined) return this.startStep(following);
    if (this.holdsAny(FORWARD_KEYS)) this.walkAlong(nextJump(this.graph, this.node, this.yaw));
    else if (this.holdsAny(BACKWARD_KEYS)) this.walkAlong(nextJump(this.graph, this.node, this.yaw + Math.PI));
  }

  private walkAlong(path: string[] | null): void {
    const [first, ...rest] = path ?? [];
    if (first === undefined) return;
    this.queue = rest;
    this.startStep(first);
  }

  private startStep(target: string): void {
    if (this.node === null) return;
    const from = nodePosition(this.node);
    const to = nodePosition(target);
    this.step = { from: this.node, to: target, length: Math.hypot(to.x - from.x, to.z - from.z), progress: 0 };
  }

  private place(): void {
    if (this.node === null) return;
    const { from, to, progress } = this.step ?? { from: this.node, to: this.node, progress: 0 };
    const a = nodePosition(from);
    const b = nodePosition(to);
    const x = a.x + (b.x - a.x) * progress;
    const z = a.z + (b.z - a.z) * progress;
    const lift = this.elevation(x, z, tileOfNode(from), tileOfNode(to));
    this.camera.position.set(x, EYE_HEIGHT + lift, z);
    this.camera.rotation.set(this.pitch, this.yaw + Math.PI, 0);
    this.placeMarkers();
  }

  private placeMarkers(): void {
    const choices = this.choices();
    this.markerMeshes.forEach((mesh, index) => {
      const target = choices[index]?.path.at(-1);
      mesh.visible = target !== undefined;
      if (target === undefined || this.node === null) return;
      const position = nodePosition(target);
      const lift = this.elevation(position.x, position.z, tileOfNode(this.node), tileOfNode(target));
      mesh.position.set(position.x, lift + MARKER_LIFT, position.z);
      const distance = this.camera.position.distanceTo(mesh.position);
      mesh.scale.setScalar(Math.min(MARKER_MAX_SCALE, Math.max(1, distance / MARKER_GROWTH_DISTANCE)));
    });
  }

  // Straight jumps first, then the Pedestrian crossings in sight.
  private choices(): { path: string[] }[] {
    if (this.step || this.node === null) return [];
    const jumps = jumpPaths(this.graph, this.node).map((path) => ({ path }));
    const taken = new Set(jumps.map(({ path }) => path.at(-1)));
    this.refreshSightings(this.node);
    this.camera.updateMatrixWorld();
    this.frustum.setFromProjectionMatrix(this.projection.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));
    const seen = this.sightings.filter(({ node, path }) => !taken.has(node) && this.sees(node) && path.length > 0);
    return [...jumps, ...seen];
  }

  private refreshSightings(node: string): void {
    if (this.sightingsFor === node && this.sightingsGraph === this.graph) return;
    this.sightings = crossingSightings(this.graph, node);
    this.sightingsFor = node;
    this.sightingsGraph = this.graph;
  }

  private sees(node: string): boolean {
    const { x, z } = nodePosition(node);
    return this.frustum.containsPoint(new THREE.Vector3(x, MARKER_LIFT, z));
  }

  private holdsAny(keys: ReadonlySet<string>): boolean {
    for (const key of this.held) if (keys.has(key)) return true;
    return false;
  }

  private bindInput(): void {
    this.abort?.abort();
    this.abort = new AbortController();
    const { signal } = this.abort;
    const { canvas } = this;
    canvas.addEventListener('pointerdown', (event) => this.onPointerDown(event), { signal });
    canvas.addEventListener('pointermove', (event) => this.onPointerMove(event), { signal });
    canvas.addEventListener('pointerup', (event) => this.onPointerUp(event), { signal });
    canvas.addEventListener('pointercancel', () => (this.drag = null), { signal });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault(), { signal });
    window.addEventListener('keydown', (event) => this.onKey(event, true), { signal });
    window.addEventListener('keyup', (event) => this.onKey(event, false), { signal });
    window.addEventListener('blur', () => this.held.clear(), { signal });
  }

  private onKey(event: KeyboardEvent, pressed: boolean): void {
    const key = event.key.toLowerCase();
    if (!pressed) {
      this.held.delete(key);
      return;
    }
    if (isTypingTarget(event.target) || (event.target instanceof HTMLElement && event.target.closest('[role="dialog"]'))) return;
    if (key === 'escape') return this.onExit();
    this.held.add(key);
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointers cannot be captured; looking around still works without capture.
    }
    this.drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, startTime: performance.now(), moved: false };
  }

  private onPointerMove(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > TAP_SLOP_PX) drag.moved = true;
    this.yaw = normalizeAngle(this.yaw - (event.clientX - drag.x) * LOOK_SPEED);
    this.pitch = Math.min(PITCH_LIMIT, Math.max(-PITCH_LIMIT, this.pitch - (event.clientY - drag.y) * LOOK_SPEED));
    drag.x = event.clientX;
    drag.y = event.clientY;
  }

  private onPointerUp(event: PointerEvent): void {
    const drag = this.drag;
    this.drag = null;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved || performance.now() - drag.startTime > TAP_MAX_MS) return;
    this.walkAlong(this.pathNear(event.clientX, event.clientY));
  }

  private pathNear(clientX: number, clientY: number): string[] | null {
    const rect = this.canvas.getBoundingClientRect();
    let best: string[] | null = null;
    let bestDistance = TAP_RADIUS_PX;
    for (const { path } of this.choices()) {
      const position = nodePosition(path.at(-1)!);
      const projected = new THREE.Vector3(position.x, MARKER_LIFT, position.z).project(this.camera);
      if (projected.z > 1) continue;
      const screenX = ((projected.x + 1) / 2) * rect.width + rect.left;
      const screenY = ((1 - projected.y) / 2) * rect.height + rect.top;
      const distance = Math.hypot(screenX - clientX, screenY - clientY);
      if (distance < bestDistance) {
        best = path;
        bestDistance = distance;
      }
    }
    return best;
  }
}
