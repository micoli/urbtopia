import { describe, expect, it } from 'vitest';
import { WATER_CORNER_RADIUS, WATER_VARIANTS, cornerCode, edgeInfo, waterOutline, type Neighbourhood } from './waterShape';

function around(water: [number, number][], land: [number, number][] = []): Neighbourhood {
  const keys = new Set(water.map(([x, y]) => `${x},${y}`));
  const blocked = new Set(land.map(([x, y]) => `${x},${y}`));
  return { isWater: (x, y) => keys.has(`${x},${y}`), isFree: (x, y) => !blocked.has(`${x},${y}`) };
}

const block = (width: number, depth: number): [number, number][] => Array.from({ length: width * depth }, (_, index) => [index % width, Math.floor(index / width)]);

describe('corners of a Water tile', () => {
  it('rounds the four corners of a lone tile', () => {
    expect(cornerCode(0, 0, around([[0, 0]]))).toBe('vvvv');
  });

  it('keeps the corners square inside a body of water', () => {
    expect(cornerCode(1, 1, around(block(3, 3)))).toBe('ffff');
  });

  it('rounds only the outer corners of a rectangle, in the order north-west, north-east, south-east, south-west', () => {
    const lake = around(block(3, 3));
    expect(cornerCode(0, 0, lake)).toBe('vfff');
    expect(cornerCode(2, 0, lake)).toBe('fvff');
    expect(cornerCode(2, 2, lake)).toBe('ffvf');
    expect(cornerCode(0, 2, lake)).toBe('fffv');
  });

  it('keeps a straight shore square where the tile continues along it', () => {
    expect(cornerCode(1, 0, around(block(3, 3)))).toBe('ffff');
    expect(cornerCode(1, 0, around(block(3, 1)))).toBe('ffff');
    expect(cornerCode(0, 0, around(block(3, 1)))).toBe('vffv');
  });

  it('fills the inside corner of an L-shaped body of water', () => {
    expect(cornerCode(0, 0, around([[0, 0], [1, 0], [0, 1]]))).toBe('vfcf');
  });

  it('does not fill an inside corner onto land that is built on', () => {
    expect(cornerCode(0, 0, around([[0, 0], [1, 0], [0, 1]], [[1, 1]]))).toBe('vfff');
  });
});

describe('outline of a Water tile', () => {
  const near = (value: number, target: number) => Math.abs(value - target) < 1e-9;

  it('is a plain square when no corner is rounded', () => {
    const { outline, fillets } = waterOutline('ffff');
    expect(outline).toEqual([[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].map(([x, z]) => expect.arrayContaining([expect.closeTo(x!), expect.closeTo(z!)])));
    expect(fillets).toEqual([]);
  });

  it('never goes beyond the tile when rounding, and cuts the corner', () => {
    const { outline } = waterOutline('vvvv');
    for (const [x, z] of outline) {
      expect(Math.abs(x)).toBeLessThanOrEqual(0.5 + 1e-9);
      expect(Math.abs(z)).toBeLessThanOrEqual(0.5 + 1e-9);
    }
    expect(outline.some(([x, z]) => near(x, -0.5) && near(z, -0.5))).toBe(false);
    expect(outline.some(([x, z]) => near(x, -0.5) && near(z, -0.5 + WATER_CORNER_RADIUS))).toBe(true);
    expect(outline.some(([x, z]) => near(x, -0.5 + WATER_CORNER_RADIUS) && near(z, -0.5))).toBe(true);
  });

  it('adds a fillet outside the tile at an inside corner, touching its corner point', () => {
    const { outline, fillets } = waterOutline('cfff');
    expect(outline).toHaveLength(4);
    expect(fillets).toHaveLength(1);
    const fillet = fillets[0]!;
    expect(fillet[0]).toEqual([-0.5, -0.5]);
    for (const [x, z] of fillet) {
      expect(x).toBeLessThanOrEqual(-0.5 + 0.02);
      expect(z).toBeLessThanOrEqual(-0.5 + 0.02);
      expect(x).toBeGreaterThanOrEqual(-0.5 - WATER_CORNER_RADIUS - 1e-9);
    }
  });

  it('turns the fillet with the corner it belongs to', () => {
    const { fillets } = waterOutline('fcff');
    expect(fillets[0]![0]![0]).toBeCloseTo(0.5);
    expect(fillets[0]![0]![1]).toBeCloseTo(-0.5);
    for (const [x, z] of fillets[0]!) {
      expect(x).toBeGreaterThanOrEqual(0.5 - 0.02);
      expect(z).toBeLessThanOrEqual(-0.5 + 0.02);
    }
  });
});

describe('shore of a Water tile', () => {
  it('has no shore inside a body of water, and one on each side of a lone tile', () => {
    expect(edgeInfo(1, 1, around(block(3, 3)))).toBe('--------');
    expect(edgeInfo(0, 0, around([[0, 0]]))).toBe('11111111');
  });

  it('marks the sides along the shore of a rectangle, in the order north, east, south, west', () => {
    const lake = around(block(3, 3));
    expect(edgeInfo(1, 0, lake)).toBe('00------');
    expect(edgeInfo(0, 0, lake)).toBe('10----01');
    expect(edgeInfo(2, 2, lake)).toBe('--0110--');
  });

  it('stops the ripple short of a corner where the shore turns', () => {
    const l = around([[0, 0], [1, 0], [0, 1]]);
    expect(edgeInfo(1, 0, l)).toBe('011111--');
  });
});

describe('ripple of a straight shore', () => {
  const north = (outline: readonly (readonly [number, number])[]) => outline.filter(([, z]) => z < -0.5 + 0.3 && z > -0.5 - 1e-9);

  it('keeps a lone straight run flat when the shore is not shown', () => {
    expect(waterOutline('ffff', '--------').outline).toHaveLength(4);
  });

  it('pulls the water back from the shore, never forward and never by much', () => {
    for (let variant = 0; variant < WATER_VARIANTS; variant++) {
      const shore = north(waterOutline('ffff', '00------', variant).outline).filter(([x]) => Math.abs(x) < 0.5 - 1e-9);
      expect(shore.length).toBeGreaterThan(4);
      for (const [, z] of shore) {
        expect(z).toBeGreaterThanOrEqual(-0.5 - 1e-9);
        expect(z).toBeLessThanOrEqual(-0.5 + 0.1);
      }
      expect(Math.max(...shore.map(([, z]) => z)) + 0.5).toBeGreaterThan(0.02);
    }
  });

  it('meets the next tile exactly: the ends of a run that continues stay on the straight line', () => {
    const { outline } = waterOutline('ffff', '00------', 3);
    expect(outline).toContainEqual([-0.5, -0.5]);
    expect(outline).toContainEqual([0.5, -0.5]);
  });

  it('keeps each corner arc exactly where it was and shortens the run before it', () => {
    const { outline } = waterOutline('vfff', '10------', 2);
    expect(outline.some(([x, z]) => Math.abs(x - (-0.5 + WATER_CORNER_RADIUS)) < 1e-9 && Math.abs(z + 0.5) < 1e-9)).toBe(true);
    expect(outline.filter(([x, z]) => x < -0.5 + WATER_CORNER_RADIUS - 1e-9 && z < -0.5 + 1e-9 && Math.abs(z + 0.5) < 1e-9)).toHaveLength(0);
  });

  it('ripples differently from one variant to the next, but always the same way for one variant', () => {
    const depths = (variant: number) => waterOutline('ffff', '00------', variant).outline.map(([, z]) => Math.round(z * 1e6));
    expect(depths(1)).toEqual(depths(1));
    expect(new Set(Array.from({ length: WATER_VARIANTS }, (_, variant) => depths(variant).join(','))).size).toBe(WATER_VARIANTS);
  });
});

describe('ripple of the rounded corners', () => {
  const radiusFrom = (point: readonly [number, number], center: readonly [number, number]) => Math.hypot(point[0] - center[0], point[1] - center[1]);
  const convexCenter: [number, number] = [-0.5 + WATER_CORNER_RADIUS, -0.5 + WATER_CORNER_RADIUS];
  const arcOf = (variant: number) => waterOutline('vfff', '--------', variant).outline.filter(([x, z]) => x <= convexCenter[0] + 1e-9 && z <= convexCenter[1] + 1e-9);

  it('pulls a rounded outer corner back from its circle, never forward, and keeps the ends of the arc', () => {
    for (let variant = 0; variant < WATER_VARIANTS; variant++) {
      const arc = arcOf(variant);
      const radii = arc.map((point) => radiusFrom(point, convexCenter));
      expect(Math.max(...radii)).toBeLessThanOrEqual(WATER_CORNER_RADIUS + 1e-9);
      expect(Math.min(...radii)).toBeLessThan(WATER_CORNER_RADIUS - 0.005);
      expect(arc[0]).toEqual([-0.5, -0.5 + WATER_CORNER_RADIUS].map((value) => expect.closeTo(value)));
      expect(arc.at(-1)).toEqual([-0.5 + WATER_CORNER_RADIUS, -0.5].map((value) => expect.closeTo(value)));
    }
  });

  it('is not the same wave on every corner of a tile', () => {
    const corners = waterOutline('vvvv', '--------', 0).outline;
    const quarter = corners.length / 4;
    const depth = (corner: number) => corners.slice(corner * quarter, (corner + 1) * quarter).map(([x, z]) => Math.round(Math.hypot(x, z) * 1e4));
    expect(new Set([0, 1, 2, 3].map((corner) => depth(corner).join(','))).size).toBeGreaterThan(1);
  });

  it('pushes an inside fillet back toward the corner it fills, keeping its ends', () => {
    const center: [number, number] = [-0.5 - WATER_CORNER_RADIUS, -0.5 - WATER_CORNER_RADIUS];
    const fillet = waterOutline('cfff', '--------', 4).fillets[0]!.slice(1);
    const radii = fillet.map((point) => radiusFrom(point, center));
    expect(Math.min(...radii)).toBeGreaterThanOrEqual(WATER_CORNER_RADIUS - 1e-9);
    expect(Math.max(...radii)).toBeGreaterThan(WATER_CORNER_RADIUS + 0.005);
    expect(radii[0]).toBeCloseTo(WATER_CORNER_RADIUS);
    expect(radii.at(-1)).toBeCloseTo(WATER_CORNER_RADIUS);
  });
});
