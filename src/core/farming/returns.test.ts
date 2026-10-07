import { describe, expect, it } from 'vitest';
import { CROPS, CROP_IDS, cropReturns } from '../index';

describe('Crop returns', () => {
  it('takes the Seed packs out of the harvest and stores the rest', () => {
    expect(cropReturns('wheat', 4)).toMatchObject({ seeds: 4, stored: 8 });
  });

  it('rounds the returned Seed packs down per harvest', () => {
    expect(cropReturns('wheat', 1)).toMatchObject({ seeds: 1, stored: 2 });
  });

  it('sells surplus packs for half their price', () => {
    const returns = cropReturns('wheat', 4);
    expect(returns.seedBalance).toBe(0);
    const surplus = cropReturns('corn', 10);
    expect(surplus.seeds).toBe(14);
    expect(surplus.seedBalance).toBe(4 * Math.floor(CROPS.corn.seedPrice / 2));
  });

  it('values the stored crops at the best Packhouse price', () => {
    expect(cropReturns('wheat', 4).cropValue).toBeCloseTo(8 * (CROPS.wheat.packedValue * 1.25) / 2, 5);
  });

  it('prices profit per hour from the growth time', () => {
    const returns = cropReturns('wheat', 10);
    expect(returns.profitPerHour).toBeCloseTo(returns.profit / (CROPS.wheat.growthMs / 3_600_000), 5);
  });

  it.each(CROP_IDS)('%s keeps the stored amount and the seeds equal to the whole yield', (crop) => {
    const returns = cropReturns(crop, 7);
    expect(returns.seeds + returns.stored).toBe(7 * CROPS[crop].yield);
  });
});
