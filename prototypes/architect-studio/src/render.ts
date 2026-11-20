// PROTOTYPE — procedural 3D renderer for a Plan. Slots are built in a local frame:
// x = right (seen from outside), y = up, z = outward normal.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  DIR_DELTA,
  activeChimneys,
  activeDormers,
  GRID,
  PITCH_FACTOR,
  exteriorEdges,
  getBrick,
  isOccupied,
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
} from './model.ts';

export type PickHit = { kind: 'roof'; col: number; row: number } | { kind: 'edge'; edge: Edge };

export type SlotRef = Edge & { roof?: boolean }; // roof: the ghost marks the dormer spot one level up

const T = 0.1;
const SEAM = 0.004;
const OVERHANG = 0.12;
const SIDE_ROTATION = [Math.PI, Math.PI / 2, 0, -Math.PI / 2];

const glassMaterial = new THREE.MeshStandardMaterial({ color: '#8fc8e8', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.75 });
const doorMaterial = new THREE.MeshStandardMaterial({ color: '#6b4226', roughness: 0.8 });
const railMaterial = new THREE.MeshStandardMaterial({ color: '#4a4a52', roughness: 0.6 });
const slabMaterial = new THREE.MeshStandardMaterial({ color: '#b8b8b8', roughness: 0.9 });
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

function buildSlot(brick: Brick, wall: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const w = (size: [number, number, number], pos: [number, number, number]) =>
    box(g, [size[0] + SEAM, size[1] + SEAM, size[2]], [pos[0], pos[1] - SEAM / 2 - 0.003, pos[2]], wall);
  const z = -T / 2;
  switch (brick) {
    case 'wall':
      w([1, 1, T], [0, 0.5, z]);
      break;
    case 'window':
    case 'balcony':
      w([1, 0.35, T], [0, 0.175, z]);
      w([1, 0.25, T], [0, 0.875, z]);
      w([0.2, 0.4, T], [-0.4, 0.55, z]);
      w([0.2, 0.4, T], [0.4, 0.55, z]);
      box(g, [0.6, 0.4, 0.02], [0, 0.55, z], glassMaterial);
      if (brick === 'balcony') {
        box(g, [1, 0.06, 0.5], [0, 0.03, 0.25], slabMaterial);
        box(g, [1, 0.28, 0.03], [0, 0.2, 0.5], railMaterial);
        box(g, [0.03, 0.28, 0.5], [-0.485, 0.2, 0.25], railMaterial);
        box(g, [0.03, 0.28, 0.5], [0.485, 0.2, 0.25], railMaterial);
      }
      break;
    case 'bay':
      w([1, 0.15, T], [0, 0.075, z]);
      w([1, 0.15, T], [0, 0.925, z]);
      w([0.1, 0.7, T], [-0.45, 0.5, z]);
      w([0.1, 0.7, T], [0.45, 0.5, z]);
      box(g, [0.8, 0.7, 0.02], [0, 0.5, z], glassMaterial);
      break;
    case 'door':
      w([1, 0.25, T], [0, 0.875, z]);
      w([0.2, 0.75, T], [-0.4, 0.375, z]);
      w([0.2, 0.75, T], [0.4, 0.375, z]);
      box(g, [0.6, 0.75, 0.05], [0, 0.375, z], doorMaterial);
      box(g, [0.8, 0.05, 0.25], [0, 0.025, 0.125], slabMaterial);
      break;
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
function lowestPlaneGeometry(xl: number, xr: number, z0: number, z1: number, planes: Plane[]): THREE.BufferGeometry {
  const positions: number[] = [];
  planes.forEach((plane, k) => {
    let poly: [number, number][] = [[xl, z0], [xr, z0], [xr, z1], [xl, z1]];
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

const chimneyMaterial = new THREE.MeshStandardMaterial({ color: '#9a4a3a', roughness: 0.9 });

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
      const { ex, ez } = current;
      current = edges.find((e) => !used.has(e) && e.sx === ex && e.sz === ez);
    }
    loops.push(loop);
  }
  return loops;
}

// One mansard roof following the outline of several touching wings (L, U, T footprints).
function buildMansardPart(plan: Plan, cluster: Rect[], profileOf: Rect, selected: boolean): THREE.Object3D {
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
    const [pn, cn] = [DIR_DELTA[prev.dir]!, DIR_DELTA[cur.dir]!];
    const [x, z] = [cur.sx - half, cur.sz - half];
    const sameDir = prev.dir === cur.dir;
    const point = (a: EaveEdge, other: EaveEdge | null, amount: (e: EaveEdge) => number, y: number) => {
      const n = DIR_DELTA[a.dir]!;
      const m = other ? DIR_DELTA[other.dir]! : [0, 0];
      const sign = y === h1 ? -1 : 1;
      return [x + sign * (amount(a) * n[0]! + (other ? amount(other) * m[0]! : 0)), y, z + sign * (amount(a) * n[1]! + (other ? amount(other) * m[1]! : 0))];
    };
    const over = Math.max(prev.overhang, cur.overhang);
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
      if (prev.dir === edge.dir && inset(prev) !== inset(edge)) contour.push(new THREE.Vector2(start.prevBrk[0]!, start.prevBrk[2]!));
      contour.push(new THREE.Vector2(start.curBrk[0]!, start.curBrk[2]!));
      triangles.push(start.curEave, end.prevEave, end.prevBrk, start.curEave, end.prevBrk, start.curBrk);
      if (prev.dir === edge.dir && prev.overhang !== edge.overhang) triangles.push(start.prevEave, start.prevBrk, start.curEave, start.prevBrk, start.curBrk, start.curEave);
    });
    outline.push({ area: Math.abs(THREE.ShapeUtils.area(contour)), contour });
  }
  outline.sort((a, b) => b.area - a.area);
  const [outer, ...holes] = outline;
  if (outer) {
    const flat = [...outer.contour, ...holes.flatMap((hole) => hole.contour)];
    const indices = THREE.ShapeUtils.triangulateShape(outer.contour, holes.map((hole) => hole.contour));
    for (const [a, b, c] of indices) triangles.push(...[a, b, c].map((i) => [flat[i!]!.x, h1, flat[i!]!.y]));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(triangles.flat(), 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
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
function buildPyramidPart(plan: Plan, part: Rect[], profileOf: Rect, selected: boolean): THREE.Object3D {
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
    const over = other ? Math.max(a.overhang, other.overhang) : a.overhang;
    return [x - half + a.overhang * n[0]! + o2 * m[0]!, -k * OVERHANG, z - half + a.overhang * n[1]! + o2 * m[1]!];
  };
  for (const loop of loops) {
    loop.forEach((edge, i) => {
      const prev = loop[(i - 1 + loop.length) % loop.length]!;
      const next = loop[(i + 1) % loop.length]!;
      const sameStart = prev.dir === edge.dir;
      const sameEnd = next.dir === edge.dir;
      const eaveStart = eave(edge.sx, edge.sz, edge, sameStart ? null : prev);
      const eaveEnd = eave(edge.ex, edge.ez, edge, sameEnd ? null : next);
      const s = [edge.sx - half, 0, edge.sz - half];
      const e = [edge.ex - half, 0, edge.ez - half];
      positions.push(...s, ...e, ...eaveEnd, ...s, ...eaveEnd, ...eaveStart);
      if (sameStart && prev.overhang !== edge.overhang) positions.push(...s, ...eave(edge.sx, edge.sz, prev, null), ...eaveStart);
    });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: plan.roofColor,
    roughness: 0.85,
    flatShading: true,
    emissive: selected ? '#7a5200' : '#000000',
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
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
  for (const floor of floors) group.add(build(plan, cluster.filter((r) => r.floor === floor), cluster[0]!, selected));
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
  shape.lineTo(0, 0.22);
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
    mesh = new THREE.Mesh(new THREE.BoxGeometry(w + oW + oE, 0.12, d + oN + oS), material);
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
    ]);
    material.side = THREE.DoubleSide;
    mesh = new THREE.Mesh(geometry, material);
  } else if (style.type === 'mansard') {
    // Steep lower slope up to a break line, then a shallow hipped top.
    const { ins, h1, h2 } = mansardProfile(rect, style);
    const lowerSlope = h1 / ins;
    const y = () => -lowerSlope * OVERHANG; // one horizontal base, whatever the overhangs
    const xl = -span / 2 - spanLeft;
    const xr = span / 2 + spanRight;
    const z0 = -(length / 2 + lenStart);
    const z1 = length / 2 + lenEnd;
    const A0 = [xl, y(), z0];
    const B0 = [xr, y(), z0];
    const C0 = [xr, y(), z1];
    const D0 = [xl, y(), z1];
    const kl = -span / 2 + ins;
    const kr = span / 2 - ins;
    const kz0 = -length / 2 + ins;
    const kz1 = length / 2 - ins;
    const A1 = [kl, h1, kz0];
    const B1 = [kr, h1, kz0];
    const C1 = [kr, h1, kz1];
    const D1 = [kl, h1, kz1];
    const rz = Math.max(0, (length - span) / 2);
    const R1 = [0, h2, -rz];
    const R2 = [0, h2, rz];
    const triangles = [
      A0, B0, B1, A0, B1, A1,
      B0, C0, C1, B0, C1, B1,
      C0, D0, D1, C0, D1, C1,
      D0, A0, A1, D0, A1, D1,
      A1, B1, R1, A1, R1, R2, A1, R2, D1, B1, C1, R2, B1, R2, R1, C1, D1, R2,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(triangles.flat(), 3));
    geometry.computeVertexNormals();
    material.side = THREE.DoubleSide;
    mesh = new THREE.Mesh(geometry, material);
    if (alongX) mesh.rotation.y = Math.PI / 2;
  } else if (style.type === 'hip') {
    const height = span * PITCH_FACTOR[style.pitch];
    const slope = height / (span / 2);
    const geometry = lowestPlaneGeometry(-span / 2 - spanLeft, span / 2 + spanRight, -(length / 2 + lenStart), length / 2 + lenEnd, [
      (x) => slope * (x + span / 2),
      (x) => slope * (span / 2 - x),
      (_, z) => slope * (z + length / 2),
      (_, z) => slope * (length / 2 - z),
    ]);
    material.side = THREE.DoubleSide;
    mesh = new THREE.Mesh(geometry, material);
    if (alongX) mesh.rotation.y = Math.PI / 2;
  } else {
    const left = -span / 2;
    const right = span / 2;
    const highRight = high === 0 || high === 1;
    const shed = style.type === 'shed';
    const height = span * PITCH_FACTOR[style.pitch] * (shed ? 0.7 : style.type === 'saltbox' ? 0.9 : 1);
    const ridge = style.type === 'saltbox' ? (highRight ? right - span / 3 : left + span / 3) : 0;
    const shape = new THREE.Shape();
    if (!shed) {
      const slopeLeft = height / (ridge - left);
      const slopeRight = height / (right - ridge);
      const eaveDrop = OVERHANG * Math.min(slopeLeft, slopeRight); // both eaves at the same level
      const reachLeft = spanLeft > 0 ? eaveDrop / slopeLeft : 0;
      const reachRight = spanRight > 0 ? eaveDrop / slopeRight : 0;
      const [xl, xr] = [left - reachLeft, right + reachRight];
      const base = spanLeft > 0 || spanRight > 0 ? -eaveDrop : 0; // the base stays horizontal
      shape.moveTo(xl, base);
      shape.lineTo(xr, base);
      shape.lineTo(xr, -slopeRight * reachRight);
      shape.lineTo(ridge, height);
      shape.lineTo(xl, -slopeLeft * reachLeft);
    } else {
      const slope = height / span;
      const [xl, xr] = [left - spanLeft, right + spanRight];
      const base = -slope * (highRight ? spanLeft : spanRight);
      shape.moveTo(xl, base);
      shape.lineTo(xr, base);
      shape.lineTo(xr, highRight ? height + slope * spanRight : base);
      shape.lineTo(xl, highRight ? base : height + slope * spanLeft);
    }
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: length + lenStart + lenEnd, bevelEnabled: false });
    geometry.translate(0, 0, -(length / 2 + lenStart));
    mesh = new THREE.Mesh(geometry, material);
    if (alongX) mesh.rotation.y = Math.PI / 2;
  }
  mesh.castShadow = true;
  mesh.userData.roof = true;
  group.add(mesh);
  return group;
}

export function buildHouse(plan: Plan, highlight?: SlotRef, selectedRoof?: string): THREE.Group {
  const house = new THREE.Group();
  const wall = new THREE.MeshStandardMaterial({ color: plan.wallColor, roughness: 0.9 });
  const half = GRID / 2;

  plan.floors.forEach((floor, f) => {
    floor.forEach((row, r) =>
      row.forEach((on, c) => {
        if (!on) return;
        box(house, [1 - 2 * T, 0.04, 1 - 2 * T], [c + 0.5 - half, f + 0.98, r + 0.5 - half], slabMaterial);
        if (f === 0) box(house, [1, 0.08, 1], [c + 0.5 - half, -0.04, r + 0.5 - half], slabMaterial);
      }),
    );
  });

  for (const edge of exteriorEdges(plan)) {
    const slot = buildSlot(getBrick(plan, edge), wall);
    const [dx, dz] = DIR_DELTA[edge.dir]!;
    slot.position.set(edge.c + 0.5 - half + dx! * 0.5, edge.floor, edge.r + 0.5 - half + dz! * 0.5);
    slot.rotation.y = SIDE_ROTATION[edge.dir]!;
    slot.userData.edge = edge;
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
    house.add(cluster.length > 1 || isContourRoof(roofStyle(plan, rect).type) ? buildMansardCluster(plan, cluster, cluster.some((r) => r.key === selectedRoof)) : buildRoof(plan, rect, rect.key === selectedRoof));
  }
  return house;
}

export class Viewer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private house: THREE.Group | null = null;
  private frame = 0;
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
      if (!start || !this.onPick || !this.house || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4) return;
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

    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    const loop = () => {
      controls.update();
      this.renderer.render(this.scene, this.camera);
      this.frame = requestAnimationFrame(loop);
    };
    loop();
  }

  setPlan(plan: Plan, highlight?: SlotRef, selectedRoof?: string): void {
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
