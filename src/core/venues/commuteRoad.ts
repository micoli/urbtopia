import type { RoadTile } from '../engine/state';

// Test helper: a road along the Venue at (55, 50) and the Home at (52, 50), so that the Home's Citizens can commute to its Staff posts.
export const commuteRoad: RoadTile[] = Array.from({ length: 12 }, (_, index) => ({ x: 48 + index, y: 49, kind: 'road' }));
