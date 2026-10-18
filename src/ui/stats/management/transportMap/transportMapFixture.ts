import { createBuilding, newGame, type GameState, type TransitTile } from '../../../../core';

const strip = (x: number, y: number, length: number): TransitTile[] => Array.from({ length }, (_, i) => ({ x: x + i, y, exits: i === 0 ? ['E'] : i === length - 1 ? ['W'] : ['W', 'E'] }));

export function transportMapCity(): GameState {
  return { ...newGame({ seed: 'map', now: 0 }), ownedParcels: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], urbs: 100_000, nextId: 100, adaptationUntil: 0, roundabouts: [],
    buildings: [
      { ...createBuilding(1, 'home', 0, 2, 0), tier: 3 }, createBuilding(2, 'factory', 30, 2, 0),
      createBuilding(3, 'busStop', 0, 1, 0), createBuilding(4, 'transitHub', 14, 1, 0), createBuilding(6, 'railStation', 30, 1, 0), createBuilding(7, 'busStop', 2, 1, 0),
    ],
    roads: Array.from({ length: 16 }, (_, x) => ({ x, y: 0, kind: 'road' as const })), rails: strip(16, 0, 17),
    busLines: [{ id: 10, stops: [3, 4] }, { id: 13, stops: [3, 7, 4], loop: true }], transitLines: [{ id: 11, mode: 'rail', stops: [4, 6], peakHeadway: 5, offPeakHeadway: 10 }],
    transitFleet: [{ id: 12, kind: 'trainCoal', purchasePrice: 1600, lineId: 11 }], storage: { materials: { coal: 10 }, goods: {} } };
}
