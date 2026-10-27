import { describe, expect, it } from 'vitest';
import type { PedestrianGraph } from '../core';
import { crossingSightings, jumpPaths, nearestNode, neighbourNodes, nextJump, nextNode, yawBetween } from './streetNavigation';

function line(): PedestrianGraph {
  const edge = (to: string) => ({ to, cost: 1, crossing: null });
  return new Map([
    ['1,1:N', [edge('2,1:N'), edge('1,1:W')]],
    ['2,1:N', [edge('1,1:N'), edge('3,1:N')]],
    ['3,1:N', [edge('2,1:N')]],
    ['1,1:W', [edge('1,1:N')]],
  ]);
}

describe('streetNavigation', () => {
  it('points the yaw from one node toward the next along +x', () => {
    expect(yawBetween('1,1:N', '2,1:N')).toBeCloseTo(Math.PI / 2);
  });

  it('picks the neighbour most aligned with the gaze', () => {
    expect(nextNode(line(), '2,1:N', Math.PI / 2)).toBe('3,1:N');
    expect(nextNode(line(), '2,1:N', -Math.PI / 2)).toBe('1,1:N');
  });

  it('stays put when no neighbour is within the turn limit', () => {
    expect(nextNode(line(), '3,1:N', 0)).toBeNull();
  });

  it('lists only reachable neighbours', () => {
    expect(neighbourNodes(line(), '1,1:N').sort()).toEqual(['1,1:W', '2,1:N']);
  });

  it('finds the node closest to a point', () => {
    expect(nearestNode(line(), 3.4, 1.1)).toBe('3,1:N');
    expect(nearestNode(new Map(), 0, 0)).toBeNull();
  });

  it('ignores nodes farther than the maximum distance', () => {
    expect(nearestNode(line(), 30, 30, 5)).toBeNull();
  });

  it('runs straight on along a line of nodes and stops at a bend', () => {
    expect(jumpPaths(line(), '3,1:N')).toEqual([['2,1:N', '1,1:N']]);
    expect(jumpPaths(line(), '2,1:N').map((path) => path.at(-1)).sort()).toEqual(['1,1:N', '3,1:N']);
  });

  it('jumps along the path most aligned with the gaze', () => {
    expect(nextJump(line(), '3,1:N', -Math.PI / 2)).toEqual(['2,1:N', '1,1:N']);
    expect(nextJump(line(), '3,1:N', Math.PI / 2)).toBeNull();
  });

  it('sights the near side of a Pedestrian crossing and the way to it', () => {
    const edge = (to: string, crossing: string | null = null) => ({ to, cost: 1, crossing });
    const graph: PedestrianGraph = new Map([
      ['1,1:N', [edge('2,1:N')]],
      ['2,1:N', [edge('1,1:N'), edge('3,1:N')]],
      ['3,1:N', [edge('2,1:N'), edge('3,1:S', '3,1')]],
      ['3,1:S', [edge('3,1:N', '3,1')]],
    ]);
    expect(crossingSightings(graph, '1,1:N')).toEqual([{ node: '3,1:N', path: ['2,1:N', '3,1:N'] }]);
    expect(crossingSightings(graph, '3,1:N')).toEqual([]);
  });

  it('runs straight on past a node, but halts at a stop', () => {
    expect(jumpPaths(line(), '1,1:N').map((path) => path.at(-1)).sort()).toEqual(['1,1:W', '3,1:N']);
    expect(jumpPaths(line(), '1,1:N', new Set(['2,1:N'])).map((path) => path.at(-1)).sort()).toEqual(['1,1:W', '2,1:N']);
  });

  it('starts again from a stop', () => {
    expect(nextJump(line(), '2,1:N', Math.PI / 2, new Set(['2,1:N']))).toEqual(['3,1:N']);
  });
});
