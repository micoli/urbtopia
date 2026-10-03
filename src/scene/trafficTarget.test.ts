import { describe, expect, it } from 'vitest';
import { targetVehicleCount } from './trafficTarget';

describe('targetVehicleCount', () => {
  it('puts one Vehicle on the road per 10 Citizens', () => {
    expect(targetVehicleCount({ citizens: 100, roadTiles: 500, touch: false })).toBe(10);
  });

  it('shows no Vehicle until the city has 10 Citizens', () => {
    expect(targetVehicleCount({ citizens: 6, roadTiles: 500, touch: false })).toBe(0);
  });

  it('never exceeds 150 Vehicles', () => {
    expect(targetVehicleCount({ citizens: 5000, roadTiles: 5000, touch: false })).toBe(150);
  });

  it('halves the ceiling on a touch screen', () => {
    expect(targetVehicleCount({ citizens: 5000, roadTiles: 5000, touch: true })).toBe(75);
  });

  it('keeps one Vehicle per 2 road tiles at most', () => {
    expect(targetVehicleCount({ citizens: 1000, roadTiles: 7, touch: false })).toBe(3);
  });

  it('shows nothing without roads', () => {
    expect(targetVehicleCount({ citizens: 1000, roadTiles: 0, touch: false })).toBe(0);
  });
});
