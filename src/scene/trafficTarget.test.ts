import { describe, expect, it } from 'vitest';
import { targetVehicleCount } from './trafficTarget';

describe('targetVehicleCount', () => {
  it('puts one Vehicle on the road per 10 Commuters', () => {
    expect(targetVehicleCount({ commuters: 100, laneTiles: 500, touch: false })).toBe(10);
  });

  it('shows no Vehicle until the city has 10 Commuters', () => {
    expect(targetVehicleCount({ commuters: 6, laneTiles: 500, touch: false })).toBe(0);
  });

  it('never exceeds 150 Vehicles', () => {
    expect(targetVehicleCount({ commuters: 5000, laneTiles: 5000, touch: false })).toBe(150);
  });

  it('halves the ceiling on a touch screen', () => {
    expect(targetVehicleCount({ commuters: 5000, laneTiles: 5000, touch: true })).toBe(75);
  });

  it('keeps one Vehicle per 2 lane tiles at most', () => {
    expect(targetVehicleCount({ commuters: 1000, laneTiles: 7, touch: false })).toBe(3);
  });

  it('shows nothing without roads', () => {
    expect(targetVehicleCount({ commuters: 1000, laneTiles: 0, touch: false })).toBe(0);
  });
});
