import { describe, expect, it } from 'vitest';
import { cellsOfBoard, hexNeighbourOf } from '../core';
import { cellToPoint, cornerOf, edgeCorners, pointToCell } from './hexLayout';

const ORIGIN = { q: 0, r: 0 };

describe('the layout of hexagons on the ground', () => {
  it('puts the origin at the origin of the ground', () => {
    expect(cellToPoint(ORIGIN, 1)).toEqual({ x: 0, z: 0 });
  });

  it.each([
    { edge: 0, name: 'east', x: 1, z: 0 },
    { edge: 1, name: 'north-east', x: 0.5, z: -1 },
    { edge: 2, name: 'north-west', x: -0.5, z: -1 },
    { edge: 3, name: 'west', x: -1, z: 0 },
    { edge: 4, name: 'south-west', x: -0.5, z: 1 },
    { edge: 5, name: 'south-east', x: 0.5, z: 1 },
  ])('puts the neighbour across edge $edge to the $name, a hexagon width away', ({ edge, x, z }) => {
    const point = cellToPoint(hexNeighbourOf(ORIGIN, edge), 2);
    const width = 2 * Math.sqrt(3);
    expect(Math.hypot(point.x, point.z)).toBeCloseTo(width, 5);
    expect(Math.sign(point.x)).toBe(Math.sign(x));
    expect(Math.sign(point.z)).toBe(Math.sign(z));
  });

  it('finds the cell back from the point of its centre, on a whole board', () => {
    for (const cell of cellsOfBoard(4)) expect(pointToCell(cellToPoint(cell, 1.3), 1.3)).toEqual(cell);
  });

  it('finds the cell back from a point near a corner of it', () => {
    const cell = { q: 2, r: -1 };
    const centre = cellToPoint(cell, 1);
    for (let index = 0; index < 6; index++) {
      const corner = cornerOf(centre, 1, index);
      const inside = { x: centre.x + (corner.x - centre.x) * 0.9, z: centre.z + (corner.z - centre.z) * 0.9 };
      expect(pointToCell(inside, 1)).toEqual(cell);
    }
  });

  it('has the six corners one circumradius from the centre', () => {
    for (let index = 0; index < 6; index++) {
      const corner = cornerOf({ x: 3, z: 4 }, 2, index);
      expect(Math.hypot(corner.x - 3, corner.z - 4)).toBeCloseTo(2, 6);
    }
  });

  it('bounds each edge with the two corners that face its neighbour', () => {
    const size = 1;
    for (let edge = 0; edge < 6; edge++) {
      const [a, b] = edgeCorners({ x: 0, z: 0 }, size, edge);
      const middle = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
      const neighbour = cellToPoint(hexNeighbourOf(ORIGIN, edge), size);
      expect(middle.x * 2).toBeCloseTo(neighbour.x, 6);
      expect(middle.z * 2).toBeCloseTo(neighbour.z, 6);
    }
  });
});
