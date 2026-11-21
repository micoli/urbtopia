import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ROOF_THICKNESS, thickened } from './roofSlab.ts';

const surface = (triangles: number[][]) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(triangles.flat(), 3));
  return geometry;
};

const positionsOf = (geometry: THREE.BufferGeometry) => geometry.getAttribute('position');

describe('a thick roof', () => {
  it('has a top, a bottom lowered by the thickness and a fascia along each border edge', () => {
    const slab = positionsOf(thickened(surface([[0, 0, 0, 1, 0, 0, 0, 0, 1]])));
    expect(slab.count).toBe(3 + 3 + 3 * 6);
    const ys = Array.from({ length: slab.count }, (_, i) => slab.getY(i));
    expect(Math.min(...ys)).toBeCloseTo(-ROOF_THICKNESS);
    expect(Math.max(...ys)).toBeCloseTo(0);
  });

  it('puts no fascia on the edge two triangles share', () => {
    const slab = positionsOf(thickened(surface([[0, 0, 0, 1, 0, 0, 1, 0, 1], [0, 0, 0, 1, 0, 1, 0, 0, 1]])));
    expect(slab.count).toBe(6 + 6 + 4 * 6);
  });

  it('puts no fascia along a seam where one patch has a vertex in the middle of the edge of its neighbour', () => {
    const slab = positionsOf(
      thickened(surface([[0, 0, 0, 2, 0, 0, 2, 0, 2], [0, 0, 0, 2, 0, 2, 0, 0, 2], [2, 0, 0, 3, 0, 0, 2, 0, 1], [3, 0, 0, 3, 0, 1, 2, 0, 1], [3, 0, 1, 3, 0, 2, 2, 0, 1], [3, 0, 2, 2, 0, 2, 2, 0, 1]])),
    );
    // Six triangles above and below, and the seven edges of the outline of the two patches (not the three along the seam).
    expect(slab.count).toBe(18 + 18 + 7 * 6);
  });

  it('ignores a flat triangle, which would hide the border edge it shares with a real one', () => {
    const real = positionsOf(thickened(surface([[0, 0, 0, 1, 0, 0, 0, 0, 1]])));
    const withFlat = positionsOf(thickened(surface([[0, 0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0, 1]])));
    expect(withFlat.count).toBe(real.count);
  });
});
