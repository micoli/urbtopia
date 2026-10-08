import { describe, expect, it } from 'vitest';
import { WATER_CORNER_RADIUS, cornerCode, waterOutline, type Neighbourhood } from './waterShape';

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
      expect(x).toBeLessThanOrEqual(-0.5 + 1e-9);
      expect(z).toBeLessThanOrEqual(-0.5 + 1e-9);
      expect(x).toBeGreaterThanOrEqual(-0.5 - WATER_CORNER_RADIUS - 1e-9);
    }
  });

  it('turns the fillet with the corner it belongs to', () => {
    const { fillets } = waterOutline('fcff');
    expect(fillets[0]![0]![0]).toBeCloseTo(0.5);
    expect(fillets[0]![0]![1]).toBeCloseTo(-0.5);
    for (const [x, z] of fillets[0]!) {
      expect(x).toBeGreaterThanOrEqual(0.5 - 1e-9);
      expect(z).toBeLessThanOrEqual(-0.5 + 1e-9);
    }
  });
});
