import * as THREE from 'three';

// The 0.03 slab of the roofs of the game's house models, at the scale of the studio (a floor is 1 high here, 0.26 there).
export const ROOF_THICKNESS = 0.1;

type Point = [number, number, number];
type Triangle = [Point, Point, Point];

const EDGE_PROBE = 5e-4;

const keyOf = (p: Point) => p.map((v) => Math.round(v * 1e4)).join(',');

function covers(triangles: Triangle[], x: number, z: number): boolean {
  return triangles.some(([a, b, c]) => {
    const d = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
    if (Math.abs(d) < 1e-9) return false;
    const u = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / d;
    const v = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / d;
    return u >= 0 && v >= 0 && u + v <= 1;
  });
}

// An edge used by a single triangle is on the border of the roof, unless a neighbouring patch ends there with a vertex
// in the middle of it: a probe on the side opposite to its own triangle tells the two apart.
function borderEdges(triangles: Triangle[]): [Point, Point][] {
  const seen = new Map<string, { edge: [Point, Point]; apex: Point; count: number }>();
  for (const triangle of triangles) {
    for (let i = 0; i < 3; i++) {
      const [a, b, apex] = [triangle[i]!, triangle[(i + 1) % 3]!, triangle[(i + 2) % 3]!];
      const [ka, kb] = [keyOf(a), keyOf(b)];
      const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
      const entry = seen.get(key);
      if (entry) entry.count++;
      else seen.set(key, { edge: [a, b], apex, count: 1 });
    }
  }
  return [...seen.values()]
    .filter(({ count }) => count === 1)
    .filter(({ edge: [a, b], apex }) => {
      const length = Math.hypot(b[0] - a[0], b[2] - a[2]);
      if (length < 1e-6) return false;
      let [nx, nz] = [-(b[2] - a[2]) / length, (b[0] - a[0]) / length];
      if (nx * (apex[0] - a[0]) + nz * (apex[2] - a[2]) > 0) [nx, nz] = [-nx, -nz];
      return !covers(triangles, (a[0] + b[0]) / 2 + nx * EDGE_PROBE, (a[2] + b[2]) / 2 + nz * EDGE_PROBE);
    })
    .map(({ edge }) => edge);
}

// A roof surface (triangles, facing up) becomes a slab: the same surface lowered by the thickness, and a fascia along its border.
export function thickened(surface: THREE.BufferGeometry): THREE.BufferGeometry {
  const source = surface.getAttribute('position').array;
  const triangles: Triangle[] = [];
  for (let i = 0; i + 8 < source.length; i += 9) {
    const triangle: Triangle = [
      [source[i]!, source[i + 1]!, source[i + 2]!],
      [source[i + 3]!, source[i + 4]!, source[i + 5]!],
      [source[i + 6]!, source[i + 7]!, source[i + 8]!],
    ];
    // A clipped polygon can repeat a vertex: its flat triangle would hide the border edge it shares with a real one.
    if (new Set(triangle.map(keyOf)).size === 3) triangles.push(triangle);
  }
  const positions: number[] = [];
  const down = (p: Point): Point => [p[0], p[1] - ROOF_THICKNESS, p[2]];
  for (const [a, b, c] of triangles) positions.push(...a, ...b, ...c, ...down(a), ...down(c), ...down(b));
  for (const [a, b] of borderEdges(triangles)) positions.push(...a, ...b, ...down(b), ...a, ...down(b), ...down(a));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}
