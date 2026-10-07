import { GOODS, PACK_FORMATS } from '../economy/items';
import { CROPS, type CropId } from './crops';
import { seedsReturned, storedYield } from './fields';
import { seedSellPrice } from './seeds';

const HOUR_MS = 3_600_000;

export interface CropReturns {
  seeds: number;
  stored: number;
  cropValue: number;
  seedBalance: number;
  profit: number;
  profitPerHour: number;
}

function packedUnitValue(species: CropId): number {
  return Math.max(...PACK_FORMATS.map(({ suffix, size }) => GOODS[`${species}${suffix}`].value / size));
}

export function cropReturns(species: CropId, tiles: number): CropReturns {
  const spec = CROPS[species];
  const seeds = seedsReturned(species, tiles);
  const stored = storedYield(species, tiles);
  const cropValue = stored * packedUnitValue(species);
  const surplus = seeds - tiles;
  const seedBalance = surplus >= 0 ? surplus * seedSellPrice(species) : surplus * spec.seedPrice;
  const profit = cropValue + seedBalance;
  return { seeds, stored, cropValue, seedBalance, profit, profitPerHour: profit / (spec.growthMs / HOUR_MS) };
}
