// PROTOTYPE — procedural 3D renderer for a Plan. Slots are built in a local frame:
// x = right (seen from outside), y = up, z = outward normal.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ViewHelper } from 'three/addons/helpers/ViewHelper.js';
import { ROOF_THICKNESS, thickened } from './roofSlab.ts';
import { decorModel, loadSlotModels, slotModel } from './slotModels.ts';
import { OPENINGS, cornerOutlines } from './slotOpenings.ts';
import { DARK_COLOR, PLINTH_HEIGHT, PLINTH_PUSH, TRIM_COLOR, WALL_CORNER_RADIUS, WALL_INSET, cellReach, endShift, wallEnds, type WallEnds } from './wallLayout.ts';
import {
  DIR_DELTA,
  activeChimneys,
  activeDecors,
  activeDormers,
  GRID,
  PITCH_FACTOR,
  exteriorEdges,
  getBrick,
  hasPlinth,
  isDoorBrick,
  isOccupied,
  isRoundDormer,
  isContourRoof,
  mansardCluster,
  rectAt,
  roofRects,
  roofStyle,
  type Brick,
  type Dir,
  type Edge,
  type Plan,
  type Rect,
  type RoofStyle,
} from '../core/architect/housePlan.ts';

export type PickHit = { kind: 'roof'; col: number; row: number } | { kind: 'edge'; edge: Edge };

export type SlotRef = Edge & { roof?: boolean }; // roof: the ghost marks the dormer spot one level up

const T = 0.1;
const SEAM = 0.004;
const OVERHANG = 0.12;
const FILLET_SEGMENTS = 3;
const SIDE_ROTATION = [Math.PI, Math.PI / 2, 0, -Math.PI / 2];

// The glass colour of the game's building palette, so the lit-windows shader of the scene lights the panes of a house of a plan.
export const GAME_GLASS_COLOR = '#9fcdea';
const glassMaterial = new THREE.MeshStandardMaterial({ color: GAME_GLASS_COLOR, roughness: 0.3, metalness: 0, flatShading: true });
glassMaterial.userData.windowGlass = true;
const doorMaterial = new THREE.MeshStandardMaterial({ color: DARK_COLOR, roughness: 0.8, flatShading: true });
const railMaterial = new THREE.MeshStandardMaterial({ color: DARK_COLOR, roughness: 0.6, flatShading: true });
const slabMaterial = new THREE.MeshStandardMaterial({ color: TRIM_COLOR, roughness: 0.9, flatShading: true });
const highlightMaterial = new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: 0.45, depthTest: false });

function box(
  parent: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// Outline of a wall piece seen from above: x along the wall, y the depth from the outer face (0) to the inner one (T).
// The outer face is rounded at a convex corner. `samples` adds vertices along the faces, for a top that follows a roof.
function wallShape(x0: number, x1: number, r: number, left: boolean, right: boolean, samples: number[] = []): THREE.Shape {
  const between = (from: number, to: number) => samples.filter((x) => x > from + 1e-6 && x < to - 1e-6);
  const shape = new THREE.Shape();
  shape.moveTo(x0, T);
  for (const x of between(x0, x1)) shape.lineTo(x, T);
  shape.lineTo(x1, T);
  if (right) {
    shape.lineTo(x1, r);
    shape.absarc(x1 - r, r, r, 0, -Math.PI / 2, true);
  } else shape.lineTo(x1, 0);
  for (const x of between(left ? x0 + r : x0, right ? x1 - r : x1).reverse()) shape.lineTo(x, 0);
  if (left) {
    shape.lineTo(x0 + r, 0);
    shape.absarc(x0 + r, r, r, -Math.PI / 2, Math.PI, true);
  } else shape.lineTo(x0, 0);
  shape.closePath();
  return shape;
}

// Where a wall piece of a slot starts and ends once the walls are inset: a convex corner is reached sooner, a concave one later.
function wallSpan(x: number, width: number, ends: WallEnds): { x0: number; x1: number; left: boolean; right: boolean; r: number } {
  const [slotStart, slotEnd] = [x - width / 2 <= -0.5, x + width / 2 >= 0.5];
  const x0 = x - width / 2 + (slotStart ? endShift(ends.left) : 0);
  const x1 = x + width / 2 - (slotEnd ? endShift(ends.right) : 0);
  return { x0, x1, left: ends.left === 'convex' && slotStart, right: ends.right === 'convex' && slotEnd, r: Math.min(WALL_CORNER_RADIUS, (x1 - x0) / 2) };
}

// Wall piece whose outer face is rounded at the ends that meet a convex corner, so that two walls make a rounded corner.
function wallPiece(parent: THREE.Object3D, width: number, height: number, x: number, y: number, ends: WallEnds, material: THREE.Material): void {
  const { x0, x1, left, right, r } = wallSpan(x, width, ends);
  const geometry = new THREE.ExtrudeGeometry(wallShape(x0, x1, r, left, right), { depth: height, bevelEnabled: false, curveSegments: FILLET_SEGMENTS });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, y - height / 2, 0);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

// Wall of the slot around the opening of the brick; the model of the brick, or boxes while it is missing, fills the opening.
function buildSlot(brick: Brick, wall: THREE.Material, ends: WallEnds): THREE.Group {
  const g = new THREE.Group();
  const w = (size: [number, number, number], pos: [number, number, number]) =>
    wallPiece(g, size[0] + SEAM, size[1] + SEAM, pos[0], pos[1] - SEAM / 2 - 0.003, ends, wall);
  const z = -T / 2;
  if (brick === 'wall') {
    w([1, 1, T], [0, 0.5, z]);
    return g;
  }
  const opening = OPENINGS[brick];
  const { width, bottom, height } = opening;
  for (const outline of cornerOutlines(opening)) {
    const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y))), { depth: T, bevelEnabled: false });
    geometry.translate(0, 0, -T);
    const corner = new THREE.Mesh(geometry, wall);
    corner.castShadow = true;
    corner.receiveShadow = true;
    g.add(corner);
  }
  const top = bottom + height;
  const side = (1 - width) / 2;
  if (bottom > 0) w([1, bottom, T], [0, bottom / 2, z]);
  if (top < 1) w([1, 1 - top, T], [0, (1 + top) / 2, z]);
  for (const sign of [-1, 1]) w([side, height, T], [sign * (width + side) / 2, bottom + height / 2, z]);
  const model = slotModel(brick);
  if (model) {
    g.add(model);
    return g;
  }
  if (isDoorBrick(brick)) {
    box(g, [width, height, 0.05], [0, bottom + height / 2, z], doorMaterial);
    box(g, [width + 0.2, 0.05, 0.25], [0, 0.025, 0.125], slabMaterial);
    return g;
  }
  box(g, [width, height, 0.02], [0, bottom + height / 2, z], glassMaterial);
  if (brick === 'balcony' || brick === 'balconyDoor') {
    box(g, [1, 0.06, 0.5], [0, 0.03, 0.25], slabMaterial);
    box(g, [1, 0.28, 0.03], [0, 0.2, 0.5], railMaterial);
  }
  if (brick === 'balcony') {
    box(g, [0.03, 0.28, 0.5], [-0.485, 0.2, 0.25], railMaterial);
    box(g, [0.03, 0.28, 0.5], [0.485, 0.2, 0.25], railMaterial);
  }
  return g;
}

type Plane = (x: number, z: number) => number;

function clipHalfPlane(poly: [number, number][], g: (x: number, z: number) => number): [number, number][] {
  const out: [number, number][] = [];
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length]!;
    const gp = g(...p);
    const gq = g(...q);
    if (gp <= 0) out.push(p);
    if (gp <= 0 !== gq <= 0) {
      const t = gp / (gp - gq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  });
  return out;
}

// Roof surface = lowest of several planes over a rectangle: every corner and hip line comes out exact,
// including where the overhang differs from side to side.
// Rectangle, clockwise from the north-west corner, with the corners flagged in `rounded` cut by a quarter circle.
function roundedRectangle(xl: number, xr: number, z0: number, z1: number, rounded: boolean[]): [number, number][] {
  const r = Math.min(ROOF_FILLET, (xr - xl) / 2, (z1 - z0) / 2);
  const corners: [number, number, number, number][] = [[xl, z0, 1, 1], [xr, z0, -1, 1], [xr, z1, -1, -1], [xl, z1, 1, -1]];
  return corners.flatMap(([x, z, sx, sz], i) => {
    if (!rounded[i]) return [[x, z] as [number, number]];
    const [cx, cz] = [x + sx * r, z + sz * r];
    return Array.from({ length: ROOF_FILLET_STEPS + 1 }, (_, k) => {
      const [cos, sin] = [Math.cos(((Math.PI / 2) * k) / ROOF_FILLET_STEPS), Math.sin(((Math.PI / 2) * k) / ROOF_FILLET_STEPS)];
      return (i % 2 === 0 ? [cx - sx * r * cos, cz - sz * r * sin] : [cx - sx * r * sin, cz - sz * r * cos]) as [number, number];
    });
  });
}

function lowestPlaneGeometry(xl: number, xr: number, z0: number, z1: number, planes: Plane[], rounded: boolean[] = []): THREE.BufferGeometry {
  const positions: number[] = [];
  planes.forEach((plane, k) => {
    let poly: [number, number][] = roundedRectangle(xl, xr, z0, z1, rounded);
    planes.forEach((other, j) => {
      if (j !== k && poly.length) poly = clipHalfPlane(poly, (x, z) => plane(x, z) - other(x, z));
    });
    for (let i = 1; i + 1 < poly.length; i++) {
      for (const [x, z] of [poly[0]!, poly[i]!, poly[i + 1]!]) positions.push(x, plane(x, z), z);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function mansardProfile(rect: Rect, style: RoofStyle): { ins: number; h1: number; h2: number } {
  const w = rect.c1 - rect.c0 + 1;
  const d = rect.r1 - rect.r0 + 1;
  const alongX = style.axis === 'x' || (style.axis === 'auto' && w >= d);
  const span = alongX ? d : w;
  const length = alongX ? w : d;
  const k = PITCH_FACTOR[style.pitch] / PITCH_FACTOR.normal;
  const ins = 0.2 * Math.min(span, length);
  const h1 = span * 0.3 * k;
  return { ins, h1, h2: h1 + (span / 2 - ins) * 0.45 * k };
}

export function mansardProfileFor(plan: Plan, rect: Rect): { ins: number; h1: number; h2: number } {
  const style = roofStyle(plan, rect);
  const k = PITCH_FACTOR[style.pitch] / PITCH_FACTOR.normal;
  if (style.type === 'mansard2') return { ins: 0.5, h1: 0.65 * k, h2: 0.65 * k + 0.2 * k };
  if (mansardCluster(plan, rect).length === 1) return mansardProfile(rect, style);
  const h1 = 0.65 * k;
  return { ins: 0.4, h1, h2: h1 + 0.25 * k };
}

// Roof height above the top floor at an offset (dx, dz) from the centre of a roof section.
export function roofHeightAt(plan: Plan, rect: Rect, dx: number, dz: number): number {
  const style = roofStyle(plan, rect);
  const w = rect.c1 - rect.c0 + 1;
  const d = rect.r1 - rect.r0 + 1;
  if (style.type === 'flat') return 0.12;
  if (isContourRoof(style.type)) {
    const part = mansardCluster(plan, rect).filter((r) => r.floor === rect.floor);
    const gx = (rect.c0 + rect.c1 + 1) / 2 + dx;
    const gz = (rect.r0 + rect.r1 + 1) / 2 + dz;
    const { cells, edges } = partOutline(plan, part);
    return contourProfile(style, edges, cells).height(contourDistance(edges, gx, gz));
  }
  if (style.type === 'pyramid') {
    const height = pyramidHeight(w, d, style);
    return Math.max(0, height * (1 - Math.max(Math.abs(dx) / (w / 2), Math.abs(dz) / (d / 2))));
  }
  const high = style.high ?? 0;
  const alongX = style.type === 'shed' || style.type === 'saltbox' ? high % 2 === 0 : style.axis === 'x' || (style.axis === 'auto' && w >= d);
  const span = alongX ? d : w;
  const length = alongX ? w : d;
  const u = alongX ? -dz : dx;
  const v = alongX ? dx : dz;
  const pitch = PITCH_FACTOR[style.pitch];
  const highRight = high === 0 || high === 1;
  if (style.type === 'mansard') {
    if (mansardCluster(plan, rect).length > 1) return mansardProfileFor(plan, rect).h1;
    const { ins, h1, h2 } = mansardProfile(rect, style);
    const dist = Math.min(span / 2 - Math.abs(u), length / 2 - Math.abs(v));
    return dist < ins ? Math.max(0, (h1 * dist) / ins) : h1 + (h2 - h1) * 0.5;
  }
  if (style.type === 'hip') {
    const height = span * pitch;
    return Math.max(0, Math.min(height * (1 - Math.abs(u) / (span / 2)), (height / (span / 2)) * (length / 2 - Math.abs(v))));
  }
  if (style.type === 'shed') {
    const t = (u + span / 2) / span;
    return span * pitch * 0.7 * (highRight ? t : 1 - t);
  }
  if (style.type === 'saltbox') {
    const height = span * pitch * 0.9;
    const ridge = highRight ? span / 2 - span / 3 : -span / 2 + span / 3;
    return Math.max(0, u < ridge ? (height * (u + span / 2)) / (ridge + span / 2) : (height * (span / 2 - u)) / (span / 2 - ridge));
  }
  return span * pitch * (1 - Math.abs(u) / (span / 2));
}

const chimneyMaterial = new THREE.MeshStandardMaterial({ color: '#9a4a3a', roughness: 0.9, flatShading: true });

function buildChimney(plan: Plan, c: number, r: number): THREE.Group | null {
  const rect = rectAt(plan, c, r);
  if (!rect) return null;
  const dx = c + 0.5 - (rect.c0 + rect.c1 + 1) / 2;
  const dz = r + 0.5 - (rect.r0 + rect.r1 + 1) / 2;
  const top = roofHeightAt(plan, rect, dx, dz) + 0.4;
  const group = new THREE.Group();
  group.position.set(c + 0.5 - GRID / 2, rect.floor + 1, r + 0.5 - GRID / 2);
  box(group, [0.3, top, 0.3], [0, top / 2, 0], chimneyMaterial);
  box(group, [0.4, 0.06, 0.4], [0, top, 0], slabMaterial);
  return group;
}

interface EaveEdge {
  sx: number;
  sz: number;
  ex: number;
  ez: number;
  dir: Dir;
  overhang: number;
}

const ROOF_FILLET = 0.08; // radius of the rounded outer corners of the eaves
const ROOF_FILLET_STEPS = 4;

const edgeDirection = (e: EaveEdge): [number, number] => {
  const length = Math.hypot(e.ex - e.sx, e.ez - e.sz);
  return [(e.ex - e.sx) / length, (e.ez - e.sz) / length];
};

// A free corner (overhang on both sides) that turns outward: the eave is rounded there.
function roundsCorner(prev: EaveEdge, cur: EaveEdge): boolean {
  if (prev.overhang === 0 || cur.overhang === 0 || prev.dir === cur.dir) return false;
  const [px, pz] = edgeDirection(prev);
  const [cx, cz] = edgeDirection(cur);
  return px * cz - pz * cx > 0;
}

// Points of the quarter circle that rounds an eave corner, from the eave line of `prev` to the one of `cur`.
function cornerArc(corner: number[], prev: EaveEdge, cur: EaveEdge): number[][] {
  const [pn, cn] = [DIR_DELTA[prev.dir]!, DIR_DELTA[cur.dir]!];
  const [cx, cz] = [corner[0]! - ROOF_FILLET * (pn[0]! + cn[0]!), corner[2]! - ROOF_FILLET * (pn[1]! + cn[1]!)];
  return Array.from({ length: ROOF_FILLET_STEPS + 1 }, (_, i) => {
    const t = ((Math.PI / 2) * i) / ROOF_FILLET_STEPS;
    return [cx + ROOF_FILLET * (Math.cos(t) * pn[0]! + Math.sin(t) * cn[0]!), corner[1]!, cz + ROOF_FILLET * (Math.cos(t) * pn[1]! + Math.sin(t) * cn[1]!)];
  });
}

function boundaryLoops(cells: Set<string>, overhangOf: (c: number, r: number, dir: Dir) => number): EaveEdge[][] {
  const edges: EaveEdge[] = [];
  for (const k of cells) {
    const [c, r] = k.split(',').map(Number) as [number, number];
    DIR_DELTA.forEach(([dc, dr], d) => {
      if (cells.has(`${c + dc!},${r + dr!}`)) return;
      const dir = d as Dir;
      const overhang = overhangOf(c, r, dir);
      if (dir === 0) edges.push({ sx: c, sz: r, ex: c + 1, ez: r, dir, overhang });
      else if (dir === 1) edges.push({ sx: c + 1, sz: r, ex: c + 1, ez: r + 1, dir, overhang });
      else if (dir === 2) edges.push({ sx: c + 1, sz: r + 1, ex: c, ez: r + 1, dir, overhang });
      else edges.push({ sx: c, sz: r + 1, ex: c, ez: r, dir, overhang });
    });
  }
  const used = new Set<EaveEdge>();
  const loops: EaveEdge[][] = [];
  for (const first of edges) {
    if (used.has(first)) continue;
    const loop: EaveEdge[] = [];
    let current: EaveEdge | undefined = first;
    while (current && !used.has(current)) {
      used.add(current);
      loop.push(current);
      const { ex, ez }: EaveEdge = current;
      current = edges.find((e) => !used.has(e) && e.sx === ex && e.sz === ez);
    }
    loops.push(loop);
  }
  return loops;
}

// One mansard roof following the outline of several touching wings (L, U, T footprints).
function buildMansardPart(plan: Plan, cluster: Rect[], profileOf: Rect, selected: boolean, hipped = false): THREE.Object3D {
  const lead = cluster[0]!;
  const { ins, h1 } = mansardProfileFor(plan, profileOf);
  const slope = h1 / ins;
  const material = new THREE.MeshStandardMaterial({
    color: plan.roofColor,
    roughness: 0.85,
    flatShading: true,
    emissive: selected ? '#7a5200' : '#000000',
    side: THREE.DoubleSide,
  });
  const cells = new Set<string>();
  for (const rect of cluster) for (let c = rect.c0; c <= rect.c1; c++) for (let r = rect.r0; r <= rect.r1; r++) cells.add(`${c},${r}`);
  const loops = boundaryLoops(cells, (c, r, dir) => (isOccupied(plan, lead.floor, c + DIR_DELTA[dir]![0]!, r + DIR_DELTA[dir]![1]!) ? 0 : OVERHANG));
  const half = GRID / 2;
  const triangles: number[][] = [];
  // Against a taller neighbour the slope is dropped: the roof rises straight to the break line.
  const inset = (e: EaveEdge) => (e.overhang === 0 ? 0 : ins);
  const corner = (prev: EaveEdge, cur: EaveEdge) => {
    const [x, z] = [cur.sx - half, cur.sz - half];
    const sameDir = prev.dir === cur.dir;
    const point = (a: EaveEdge, other: EaveEdge | null, amount: (e: EaveEdge) => number, y: number) => {
      const n = DIR_DELTA[a.dir]!;
      const m = other ? DIR_DELTA[other.dir]! : [0, 0];
      const sign = y === h1 ? -1 : 1;
      return [x + sign * (amount(a) * n[0]! + (other ? amount(other) * m[0]! : 0)), y, z + sign * (amount(a) * n[1]! + (other ? amount(other) * m[1]! : 0))];
    };
    const eaveY = () => -slope * OVERHANG;
    const other = (a: EaveEdge, b: EaveEdge) => (sameDir ? null : b);
    const prevEave = point(prev, other(prev, cur), (e) => e.overhang, 0);
    const curEave = point(cur, other(cur, prev), (e) => e.overhang, 0);
    prevEave[1] = eaveY();
    curEave[1] = eaveY();
    const prevBrk = point(prev, other(prev, cur), inset, h1);
    const curBrk = point(cur, other(cur, prev), inset, h1);
    return { prevBrk, curBrk, prevEave, curEave };
  };
  const outline: { area: number; contour: THREE.Vector2[] }[] = [];
  for (const loop of loops) {
    const contour: THREE.Vector2[] = [];
    loop.forEach((edge, i) => {
      const prev = loop[(i - 1 + loop.length) % loop.length]!;
      const next = loop[(i + 1) % loop.length]!;
      const start = corner(prev, edge);
      const end = corner(edge, next);
      const startArc = roundsCorner(prev, edge) ? cornerArc(start.curEave, prev, edge) : undefined;
      const endArc = roundsCorner(edge, next) ? cornerArc(end.prevEave, edge, next) : undefined;
      if (prev.dir === edge.dir && inset(prev) !== inset(edge)) contour.push(new THREE.Vector2(start.prevBrk[0]!, start.prevBrk[2]!));
      contour.push(new THREE.Vector2(start.curBrk[0]!, start.curBrk[2]!));
      const eaveStart = startArc ? startArc.at(-1)! : start.curEave;
      const eaveEnd = endArc ? endArc[0]! : end.prevEave;
      triangles.push(eaveStart, eaveEnd, end.prevBrk, eaveStart, end.prevBrk, start.curBrk);
      if (startArc) for (let k = 0; k < startArc.length - 1; k++) triangles.push(start.curBrk, startArc[k]!, startArc[k + 1]!);
      if (prev.dir === edge.dir && prev.overhang !== edge.overhang) triangles.push(start.prevEave, start.prevBrk, start.curEave, start.prevBrk, start.curBrk, start.curEave);
    });
    outline.push({ area: Math.abs(THREE.ShapeUtils.area(contour)), contour });
  }
  outline.sort((a, b) => b.area - a.area);
  const [outer, ...holes] = outline;
  if (outer && hipped) {
    // A lone wing keeps the shallow hipped top of the mansard.
    const [xs, zs] = [outer.contour.map((p) => p.x), outer.contour.map((p) => p.y)];
    const [bx0, bx1, bz0, bz1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
    const rise = 0.45 * (PITCH_FACTOR[roofStyle(plan, profileOf).pitch] / PITCH_FACTOR.normal);
    const top = lowestPlaneGeometry(bx0, bx1, bz0, bz1, [
      (x) => h1 + rise * (x - bx0),
      (x) => h1 + rise * (bx1 - x),
      (_, z) => h1 + rise * (z - bz0),
      (_, z) => h1 + rise * (bz1 - z),
    ]);
    const positions = top.getAttribute('position').array;
    for (let i = 0; i < positions.length; i += 3) triangles.push([positions[i]!, positions[i + 1]!, positions[i + 2]!]);
  } else if (outer) {
    const flat = [...outer.contour, ...holes.flatMap((hole) => hole.contour)];
    const indices = THREE.ShapeUtils.triangulateShape(outer.contour, holes.map((hole) => hole.contour));
    for (const [a, b, c] of indices) triangles.push(...[a, b, c].map((i) => [flat[i!]!.x, h1, flat[i!]!.y]));
  }
  const surface = new THREE.BufferGeometry();
  surface.setAttribute('position', new THREE.Float32BufferAttribute(triangles.flat(), 3));
  const mesh = new THREE.Mesh(thickened(surface), material);
  mesh.castShadow = true;
  mesh.userData.roof = true;
  const group = new THREE.Group();
  group.position.y = lead.floor + 1;
  group.add(mesh);
  return group;
}

// L-infinity distance from a point (grid units) to the free sides of a roof part: the height of a
// pyramid over an outline is proportional to it. Sides against a taller wing do not count.
function contourDistance(edges: EaveEdge[], gx: number, gz: number): number {
  let best = Infinity;
  for (const e of edges) {
    if (e.overhang === 0) continue;
    const dx = Math.max(0, Math.min(e.sx, e.ex) - gx, gx - Math.max(e.sx, e.ex));
    const dz = Math.max(0, Math.min(e.sz, e.ez) - gz, gz - Math.max(e.sz, e.ez));
    best = Math.min(best, Math.max(dx, dz));
  }
  return Number.isFinite(best) ? best : 0.5;
}

const MAX_PYRAMID_HEIGHT = 1.5;
const pyramidHeight = (w: number, d: number, style: RoofStyle) => Math.min(MAX_PYRAMID_HEIGHT, Math.min(w, d) * (0.25 + PITCH_FACTOR[style.pitch]) + 0.1);

// Roof height as a function of the distance to the free walls, and the slope of the eaves.
// The pyramid is lowered so that its tallest point stays under the cap.
function contourProfile(style: RoofStyle, edges: EaveEdge[], cells: Set<string>): { height: (d: number) => number; eaveSlope: number } {
  const pitch = PITCH_FACTOR[style.pitch];
  if (style.type === 'hip2') return { height: (d) => 2 * pitch * d, eaveSlope: 2 * pitch };
  if (style.type === 'mansard2') {
    const k = pitch / PITCH_FACTOR.normal;
    const [ins, h1] = [0.5, 0.65 * k];
    return { height: (d) => (d < ins ? (h1 * d) / ins : h1 + 0.4 * k * (d - ins)), eaveSlope: h1 / ins };
  }
  let farthest = 0;
  for (const key of cells) {
    const [c, r] = key.split(',').map(Number) as [number, number];
    for (let i = 0; i <= 2; i++) for (let j = 0; j <= 2; j++) farthest = Math.max(farthest, contourDistance(edges, c + i * 0.5, r + j * 0.5));
  }
  const slope = 2 * pitch + 0.5;
  const k = farthest > 0 ? Math.min(slope, MAX_PYRAMID_HEIGHT / farthest) : slope;
  return { height: (d) => k * d, eaveSlope: k };
}

function partOutline(plan: Plan, part: Rect[]): { cells: Set<string>; edges: EaveEdge[]; loops: EaveEdge[][] } {
  const floor = part[0]!.floor;
  const cells = new Set<string>();
  for (const rect of part) for (let c = rect.c0; c <= rect.c1; c++) for (let r = rect.r0; r <= rect.r1; r++) cells.add(`${c},${r}`);
  const loops = boundaryLoops(cells, (c, r, dir) => (isOccupied(plan, floor, c + DIR_DELTA[dir]![0]!, r + DIR_DELTA[dir]![1]!) ? 0 : OVERHANG));
  return { cells, edges: loops.flat(), loops };
}

// One pyramid over the whole outline: height grows with the distance to the walls, so hips and valleys
// follow the footprint. Sampled every half cell with both diagonals, which is exact for grid footprints.
function buildPyramidPart(plan: Plan, part: Rect[], profileOf: Rect, selected: boolean, _hipped = false): THREE.Object3D {
  const { cells, edges, loops } = partOutline(plan, part);
  const { height, eaveSlope: k } = contourProfile(roofStyle(plan, profileOf), edges, cells);
  const half = GRID / 2;
  const positions: number[] = [];
  const vertex = (gx: number, gz: number) => positions.push(gx - half, height(contourDistance(edges, gx, gz)), gz - half);
  for (const key of cells) {
    const [c, r] = key.split(',').map(Number) as [number, number];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const x0 = c + i * 0.5;
        const z0 = r + j * 0.5;
        const [x1, z1, xm, zm] = [x0 + 0.5, z0 + 0.5, x0 + 0.25, z0 + 0.25];
        for (const [a, b] of [[[x0, z0], [x1, z0]], [[x1, z0], [x1, z1]], [[x1, z1], [x0, z1]], [[x0, z1], [x0, z0]]] as [number, number][][]) {
          vertex(a![0]!, a![1]!);
          vertex(b![0]!, b![1]!);
          vertex(xm, zm);
        }
      }
    }
  }
  const eave = (x: number, z: number, a: EaveEdge, other: EaveEdge | null): number[] => {
    const n = DIR_DELTA[a.dir]!;
    const m = other ? DIR_DELTA[other.dir]! : [0, 0];
    const o2 = other ? other.overhang : 0;
    return [x - half + a.overhang * n[0]! + o2 * m[0]!, -k * OVERHANG, z - half + a.overhang * n[1]! + o2 * m[1]!];
  };
  for (const loop of loops) {
    loop.forEach((edge, i) => {
      const prev = loop[(i - 1 + loop.length) % loop.length]!;
      const next = loop[(i + 1) % loop.length]!;
      const sameStart = prev.dir === edge.dir;
      const sameEnd = next.dir === edge.dir;
      let eaveStart = eave(edge.sx, edge.sz, edge, sameStart ? null : prev);
      let eaveEnd = eave(edge.ex, edge.ez, edge, sameEnd ? null : next);
      const s = [edge.sx - half, 0, edge.sz - half];
      const e = [edge.ex - half, 0, edge.ez - half];
      if (roundsCorner(prev, edge)) {
        const arc = cornerArc(eaveStart, prev, edge);
        for (let k = 0; k < arc.length - 1; k++) positions.push(...s, ...arc[k]!, ...arc[k + 1]!);
        eaveStart = arc.at(-1)!;
      }
      if (roundsCorner(edge, next)) eaveEnd = cornerArc(eaveEnd, edge, next)[0]!;
      positions.push(...s, ...e, ...eaveEnd, ...s, ...eaveEnd, ...eaveStart);
      if (sameStart && prev.overhang !== edge.overhang) positions.push(...s, ...eave(edge.sx, edge.sz, prev, null), ...eaveStart);
    });
  }
  const surface = new THREE.BufferGeometry();
  surface.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.MeshStandardMaterial({
    color: plan.roofColor,
    roughness: 0.85,
    flatShading: true,
    emissive: selected ? '#7a5200' : '#000000',
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(thickened(surface), material);
  mesh.castShadow = true;
  mesh.userData.roof = true;
  const group = new THREE.Group();
  group.position.y = part[0]!.floor + 1;
  group.add(mesh);
  return group;
}

// Wings of different heights share one mansard: a stepped roof, one part per floor level.
function buildMansardCluster(plan: Plan, cluster: Rect[], selected: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const floors = [...new Set(cluster.map((r) => r.floor))];
  const build = isContourRoof(roofStyle(plan, cluster[0]!).type) ? buildPyramidPart : buildMansardPart;
  for (const floor of floors) group.add(build(plan, cluster.filter((r) => r.floor === floor), cluster[0]!, selected, cluster.length === 1));
  return group;
}

// Dormer sitting on the steep lower slope of a mansard, above its facade slot.
function buildDormer(plan: Plan, edge: Edge, rect: Rect, wall: THREE.Material): THREE.Group {
  const { ins, h1 } = mansardProfileFor(plan, rect);
  const t = ins * 0.5;
  const inner = new THREE.Group();
  inner.position.set(0, (h1 / ins) * t, -t);
  box(inner, [0.5, 0.4, 0.4], [0, 0.2, -0.2], wall);
  box(inner, [0.3, 0.22, 0.02], [0, 0.2, 0.01], glassMaterial);
  const shape = new THREE.Shape();
  shape.moveTo(-0.32, 0);
  shape.lineTo(0.32, 0);
  if (isRoundDormer(plan, edge)) shape.absarc(0, 0, 0.32, 0, Math.PI, false);
  else shape.lineTo(0, 0.22);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.46, bevelEnabled: false });
  geometry.translate(0, 0.4, -0.43);
  const roof = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: plan.roofColor, roughness: 0.85, flatShading: true }));
  roof.castShadow = true;
  inner.add(roof);
  const group = new THREE.Group();
  group.add(inner);
  const half = GRID / 2;
  const [dx, dz] = DIR_DELTA[edge.dir]!;
  group.position.set(edge.c + 0.5 - half + dx! * 0.5, edge.floor + 1, edge.r + 0.5 - half + dz! * 0.5);
  group.rotation.y = SIDE_ROTATION[edge.dir]!;
  return group;
}

// The roof is built in a local frame where the span (across the ridge) is x and the length is z,
// then rotated when the ridge runs east-west.
function buildRoof(plan: Plan, rect: Rect, selected: boolean): THREE.Object3D {
  const style = roofStyle(plan, rect);
  const material = new THREE.MeshStandardMaterial({
    color: plan.roofColor,
    roughness: 0.85,
    flatShading: true,
    emissive: selected ? '#7a5200' : '#000000',
  });
  const w = rect.c1 - rect.c0 + 1;
  const d = rect.r1 - rect.r0 + 1;
  const overhang = (side: Dir) => {
    const cells: [number, number][] = [];
    for (let c = rect.c0; c <= rect.c1; c++) for (let r = rect.r0; r <= rect.r1; r++) cells.push([c, r]);
    const [dc, dr] = DIR_DELTA[side]!;
    const touches = cells.some(([c, r]) => isOccupied(plan, rect.floor, c + dc!, r + dr!) && !cells.some(([x, y]) => x === c + dc! && y === r + dr!));
    return touches ? 0 : OVERHANG;
  };
  const [oN, oE, oS, oW] = [overhang(0), overhang(1), overhang(2), overhang(3)];

  const high = style.high ?? 0;
  const alongX = style.type === 'shed' || style.type === 'saltbox' ? high % 2 === 0 : style.axis === 'x' || (style.axis === 'auto' && w >= d);
  const span = alongX ? d : w;
  const length = alongX ? w : d;
  const [spanLeft, spanRight, lenStart, lenEnd] = alongX ? [oS, oN, oW, oE] : [oW, oE, oN, oS];
  const group = new THREE.Group();
  group.position.set((rect.c0 + rect.c1 + 1) / 2 - GRID / 2, rect.floor + 1, (rect.r0 + rect.r1 + 1) / 2 - GRID / 2);

  let mesh: THREE.Mesh;
  if (style.type === 'flat') {
    mesh = new THREE.Mesh(new RoundedBoxGeometry(w + oW + oE, 0.12, d + oN + oS, ROOF_FILLET_STEPS, 0.04), material);
    mesh.position.set((oE - oW) / 2, 0.06, (oS - oN) / 2);
  } else if (style.type === 'pyramid') {
    const height = pyramidHeight(w, d, style);
    const sx = height / (w / 2);
    const sz = height / (d / 2);
    // Both slopes differ on a rectangle: each side overhangs just enough for the eave to stay horizontal.
    const eaveDrop = OVERHANG * Math.min(sx, sz);
    const reachX = (o: number) => (o > 0 ? eaveDrop / sx : 0);
    const reachZ = (o: number) => (o > 0 ? eaveDrop / sz : 0);
    const geometry = lowestPlaneGeometry(-w / 2 - reachX(oW), w / 2 + reachX(oE), -d / 2 - reachZ(oN), d / 2 + reachZ(oS), [
      (x) => sx * (x + w / 2),
      (x) => sx * (w / 2 - x),
      (_, z) => sz * (z + d / 2),
      (_, z) => sz * (d / 2 - z),
    ], [oN > 0 && oW > 0, oN > 0 && oE > 0, oS > 0 && oE > 0, oS > 0 && oW > 0]);
    material.side = THREE.DoubleSide;
    mesh = new THREE.Mesh(thickened(geometry), material);
  } else if (style.type === 'hip') {
    const height = span * PITCH_FACTOR[style.pitch];
    const slope = height / (span / 2);
    const geometry = lowestPlaneGeometry(-span / 2 - spanLeft, span / 2 + spanRight, -(length / 2 + lenStart), length / 2 + lenEnd, [
      (x) => slope * (x + span / 2),
      (x) => slope * (span / 2 - x),
      (_, z) => slope * (z + length / 2),
      (_, z) => slope * (length / 2 - z),
    ], [spanLeft > 0 && lenStart > 0, spanRight > 0 && lenStart > 0, spanRight > 0 && lenEnd > 0, spanLeft > 0 && lenEnd > 0]);
    material.side = THREE.DoubleSide;
    mesh = new THREE.Mesh(thickened(geometry), material);
    if (alongX) mesh.rotation.y = Math.PI / 2;
  } else {
    const left = -span / 2;
    const right = span / 2;
    const highRight = high === 0 || high === 1;
    const shed = style.type === 'shed';
    const height = span * PITCH_FACTOR[style.pitch] * (shed ? 0.7 : style.type === 'saltbox' ? 0.9 : 1);
    const ridge = style.type === 'saltbox' ? (highRight ? right - span / 3 : left + span / 3) : 0;
    const slopeLeft = height / (ridge - left);
    const slopeRight = height / (right - ridge);
    const slope = height / span;
    const planes: Plane[] = shed ? [highRight ? (x) => slope * (x - left) : (x) => slope * (right - x)] : [(x) => slopeLeft * (x - left), (x) => slopeRight * (right - x)];
    // Both eaves of a gable end at the same level: the side with the gentler slope reaches further out.
    const eaveDrop = OVERHANG * Math.min(slopeLeft, slopeRight);
    const reach = (side: number, slopeOf: number) => (side > 0 ? (shed ? side : eaveDrop / slopeOf) : 0);
    const slab = lowestPlaneGeometry(
      left - reach(spanLeft, slopeLeft),
      right + reach(spanRight, slopeRight),
      -(length / 2 + lenStart),
      length / 2 + lenEnd,
      planes,
      [spanLeft > 0 && lenStart > 0, spanRight > 0 && lenStart > 0, spanRight > 0 && lenEnd > 0, spanLeft > 0 && lenEnd > 0],
    );
    material.side = THREE.DoubleSide;
    mesh = new THREE.Mesh(thickened(slab), material);
    if (alongX) mesh.rotation.y = Math.PI / 2;
  }
  mesh.castShadow = true;
  mesh.userData.roof = true;
  group.add(mesh);
  return group;
}

const EAVE_SAMPLES = 8;

// The wall of the top floor rises to the underside of the roof, which is higher than the wall top once the walls stand back from the eaves.
// It is the wall piece of the slot with its top moved onto the roof, so that it keeps the plane and the rounded corners of the wall below.
function buildWallTop(plan: Plan, edge: Edge, ends: WallEnds, wall: THREE.Material, turn: number): THREE.Mesh | null {
  if (isOccupied(plan, edge.floor + 1, edge.c, edge.r)) return null;
  const rect = roofRects(plan).find((r) => r.floor === edge.floor && edge.c >= r.c0 && edge.c <= r.c1 && edge.r >= r.r0 && edge.r <= r.r1);
  if (!rect) return null;
  const { x0, x1, left, right, r } = wallSpan(0, 1 + SEAM, ends);
  const [nx, nz] = DIR_DELTA[edge.dir]!;
  const [cx, cz] = [(rect.c0 + rect.c1 + 1) / 2, (rect.r0 + rect.r1 + 1) / 2];
  const up = new THREE.Vector3(0, 1, 0);
  const underside = (x: number) => {
    const p = new THREE.Vector3(x, 0, -WALL_INSET).applyAxisAngle(up, turn);
    return Math.max(0, roofHeightAt(plan, rect, edge.c + 0.5 + nx! * 0.5 + p.x - cx, edge.r + 0.5 + nz! * 0.5 + p.z - cz) - ROOF_THICKNESS);
  };
  const samples = Array.from({ length: EAVE_SAMPLES + 1 }, (_, k) => x0 + ((x1 - x0) * k) / EAVE_SAMPLES);
  const reach = Math.max(...samples.map(underside));
  if (reach < 0.01) return null;
  const geometry = new THREE.ExtrudeGeometry(wallShape(x0, x1, r, left, right, samples), { depth: reach, bevelEnabled: false, curveSegments: FILLET_SEGMENTS });
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) if (position.getY(i) > reach - 1e-6) position.setY(i, underside(position.getX(i)));
  geometry.translate(0, 1 - SEAM, 0);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, wall);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildHouse(plan: Plan, highlight?: SlotRef, selectedRoof?: string): THREE.Group {
  const house = new THREE.Group();
  const wall = new THREE.MeshStandardMaterial({ color: plan.wallColor, roughness: 0.9, flatShading: true });
  const half = GRID / 2;

  plan.floors.forEach((floor, f) => {
    floor.forEach((row, r) =>
      row.forEach((on, c) => {
        if (!on) return;
        const [cx, cz] = [c + 0.5 - half, r + 0.5 - half];
        const slab = cellReach(plan, f, c, r, -T / 2);
        box(house, [slab.west + slab.east, 0.04, slab.north + slab.south], [cx + (slab.east - slab.west) / 2, f + 0.98, cz + (slab.south - slab.north) / 2], slabMaterial);
        if (f > 0) return;
        box(house, [1, 0.08, 1], [cx, -0.04, cz], slabMaterial);
        if (!hasPlinth(plan)) return;
        const plinth = cellReach(plan, f, c, r, PLINTH_PUSH);
        for (const dir of [0, 1, 2, 3] as Dir[]) {
          if (isDoorBrick(getBrick(plan, { floor: 0, c, r, dir })) && !isOccupied(plan, 0, c + DIR_DELTA[dir]![0]!, r + DIR_DELTA[dir]![1]!)) plinth[['north', 'east', 'south', 'west'][dir] as keyof typeof plinth] = 0.5 - WALL_INSET - T / 2;
        }
        box(house, [plinth.west + plinth.east, PLINTH_HEIGHT, plinth.north + plinth.south], [cx + (plinth.east - plinth.west) / 2, PLINTH_HEIGHT / 2, cz + (plinth.south - plinth.north) / 2], slabMaterial);
      }),
    );
  });

  const decors = new Map(activeDecors(plan).map(({ edge, decor }) => [`${edge.floor}:${edge.c}:${edge.r}:${edge.dir}`, decor]));
  for (const edge of exteriorEdges(plan)) {
    const ends = wallEnds(plan, edge);
    const slot = buildSlot(getBrick(plan, edge), wall, ends);
    const [dx, dz] = DIR_DELTA[edge.dir]!;
    slot.position.set(edge.c + 0.5 - half + dx! * (0.5 - WALL_INSET), edge.floor, edge.r + 0.5 - half + dz! * (0.5 - WALL_INSET));
    slot.rotation.y = SIDE_ROTATION[edge.dir]!;
    slot.userData.edge = edge;
    const top = buildWallTop(plan, edge, ends, wall, SIDE_ROTATION[edge.dir]!);
    if (top) slot.add(top);
    const decor = decors.get(`${edge.floor}:${edge.c}:${edge.r}:${edge.dir}`);
    const decorMesh = decor && decorModel(decor);
    if (decorMesh) slot.add(decorMesh);
    house.add(slot);
    if (highlight && highlight.floor === edge.floor && highlight.c === edge.c && highlight.r === edge.r && highlight.dir === edge.dir) {
      const marker = new THREE.Mesh(new THREE.BoxGeometry(1.04, highlight.roof ? 0.8 : 1.04, 0.4), highlightMaterial);
      marker.position.set(0, highlight.roof ? 1.4 : 0.5, 0);
      marker.renderOrder = 10;
      marker.userData.ignore = true;
      slot.add(marker);
    }
  }

  for (const edge of activeDormers(plan)) {
    const rect = rectAt(plan, edge.c, edge.r);
    if (rect) house.add(buildDormer(plan, edge, rect, wall));
  }

  for (const [c, r] of activeChimneys(plan)) {
    const chimney = buildChimney(plan, c, r);
    if (chimney) house.add(chimney);
  }

  const handled = new Set<string>();
  for (const rect of roofRects(plan)) {
    if (handled.has(rect.key)) continue;
    const cluster = mansardCluster(plan, rect);
    cluster.forEach((r) => handled.add(r.key));
    house.add(cluster.length > 1 || isContourRoof(roofStyle(plan, rect).type) || roofStyle(plan, rect).type === 'mansard' ? buildMansardCluster(plan, cluster, cluster.some((r) => r.key === selectedRoof)) : buildRoof(plan, rect, rect.key === selectedRoof));
  }
  return house;
}

export class Viewer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private house: THREE.Group | null = null;
  private frame = 0;
  private last: [Plan, SlotRef | undefined, string | undefined] | null = null;
  private alive = true;
  private gizmo: ViewHelper | null = null;
  onPick: ((hit: PickHit) => void) | null = null;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color('#cfe6f5');
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(10, 9, 11);

    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.target.set(0, 1.2, 0);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.05;

    // Orientation gizmo: shows the camera axes, a click on X, Y or Z turns the view along it.
    const gizmo = new ViewHelper(this.camera, this.renderer.domElement);
    gizmo.center = controls.target;
    this.gizmo = gizmo;
    const clock = new THREE.Clock();

    this.scene.add(new THREE.HemisphereLight('#ffffff', '#9aa57a', 1.3));
    const sun = new THREE.DirectionalLight('#fff4dc', 2.2);
    sun.position.set(6, 10, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
    this.scene.add(sun);

    const ground = new THREE.Mesh(new THREE.CircleGeometry(14, 48), new THREE.MeshStandardMaterial({ color: '#8fb36a' }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.09;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.scene.add(new THREE.GridHelper(12, 12, '#5f8a45', '#7aa458'));

    const canvas = this.renderer.domElement;
    let down: { x: number; y: number } | null = null;
    canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', (e) => {
      const start = down;
      down = null;
      if (this.gizmo?.handleClick(e)) return;
      if (!start || !this.onPick || !this.house || Math.hypot(e.clientX - start.x, e.clientY - start.y) > (e.pointerType === 'mouse' ? 4 : 12)) return;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const caster = new THREE.Raycaster();
      caster.setFromCamera(ndc, this.camera);
      const hits = caster.intersectObject(this.house, true).filter((i) => !i.object.userData.ignore);
      const first = hits[0];
      if (!first) return;
      if (first.object.userData.roof) {
        this.onPick({ kind: 'roof', col: Math.floor(first.point.x + GRID / 2), row: Math.floor(first.point.z + GRID / 2) });
        return;
      }
      let node: THREE.Object3D | null = first.object;
      while (node && !node.userData.edge) node = node.parent;
      if (node) this.onPick({ kind: 'edge', edge: node.userData.edge as Edge });
    });

    void loadSlotModels().then(() => {
      if (this.alive && this.last) this.setPlan(...this.last);
    });

    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    const loop = () => {
      if (gizmo.animating) gizmo.update(clock.getDelta());
      else clock.getDelta();
      controls.update();
      this.renderer.autoClear = true;
      this.renderer.render(this.scene, this.camera);
      this.renderer.autoClear = false;
      gizmo.render(this.renderer);
      this.frame = requestAnimationFrame(loop);
    };
    loop();
  }

  setPlan(plan: Plan, highlight?: SlotRef, selectedRoof?: string): void {
    this.last = [plan, highlight, selectedRoof];
    if (this.house) {
      this.scene.remove(this.house);
      this.house.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    }
    this.house = buildHouse(plan, highlight, selectedRoof);
    this.scene.add(this.house);
  }

  destroy(): void {
    this.alive = false;
    this.gizmo?.dispose();
    cancelAnimationFrame(this.frame);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
