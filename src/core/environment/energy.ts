import { DAY_CYCLE, cycleHourOf, cycleTimeOf, isDaytime } from './dayCycle';
import { isVenueType } from '../venues/profiles';
import { transitServices } from '../transit/transitService';
import { ECOLOGY, distance, economicPower, homePower } from './ecology';
import { COAL_CAPACITY, UTILITY_CAPACITY } from '../economy/economy';
import type { Building, GameState } from '../engine/state';
import { isHomeType } from '../buildings/buildingDefinitions';
import { flowFactor } from '../water/flow';
import { PLANT_TYPES, generatedSourceOf, isGeneratingPlant, type EnergySourceId } from './generators';
import { solarPanelsCapacity } from './solarPanels';
import { energySavingOf } from '../politics/ordinanceEffects';

// `now` is the game clock, which sets the wind; `cycleTime` is the Day cycle clock, which sets solar and hydro.
export function productionFactors(now: number, cycleTime = now) {
  const hour = Math.floor(now / ECOLOGY.hourMs);
  const cycleHour = Math.floor(cycleHourOf(cycleTime));
  const daytimeHours = DAY_CYCLE.daytimeEnd - DAY_CYCLE.daytimeStart;
  return {
    solar: isDaytime(cycleTime) ? Math.sin(Math.PI * (cycleHour + 0.5 - DAY_CYCLE.daytimeStart) / daytimeHours) : 0,
    wind: [0.7, 0.9, 1, 0.8, 0.6, 0.75][((hour % 6) + 6) % 6]!,
    hydro: 1 - (1 - ECOLOGY.hydroMinFactor) * (1 - Math.sin(2 * Math.PI * cycleHour / DAY_CYCLE.cycleHours)) / 2,
    geothermal: 1
  };
}

export function factorsAt(state: Pick<GameState, 'timeOffset' | 'dayCycleOffset'>, now: number, hoursAhead = 0) {
  const ahead = hoursAhead * ECOLOGY.hourMs;
  return productionFactors(now + (state.timeOffset ?? 0) + ahead, cycleTimeOf(state, now) + ahead);
}

export function generatorCapacity(b: Building): number {
  if (isGeneratingPlant(b.type)) return UTILITY_CAPACITY[b.type][b.tier - 1] ?? 0;
  return b.type === 'solar' ? ECOLOGY.solarOutput : solarPanelsCapacity(b);
}

export function generatorFactor(state: GameState, b: Building, factors = factorsAt(state, state.lastSeen)): number {
  switch (generatedSourceOf(b)) {
    case 'wind': return factors.wind;
    case 'hydro': return flowFactor(state, b) * factors.hydro;
    case 'geothermal': return factors.geothermal;
    default: return factors.solar;
  }
}

export function generatorOutput(state: GameState, b: Building, factors = factorsAt(state, state.lastSeen)): number {
  return generatorCapacity(b) * generatorFactor(state, b, factors);
}

const energyCache = new WeakMap<GameState, { now: number; stats: ReturnType<typeof computeEnergyStats> }>();

export function energyStats(state: GameState, now = state.lastSeen): ReturnType<typeof computeEnergyStats> {
  const cached = energyCache.get(state);
  if (cached?.now === now) return cached.stats;
  const stats = computeEnergyStats(state, now);
  energyCache.set(state, { now, stats });
  return stats;
}

function computeEnergyStats(state: GameState, now: number) {
  const transitDemand = transitServices(state, now).reduce((n, line) => n + line.powerDemand, 0);
  let transitSupplied: number;
  const buildings = [...state.buildings].sort((a, b) => a.id - b.id);
  const homes = buildings.filter(b => isHomeType(b.type)), casinos = buildings.filter(b => b.type === 'casino'), arcades = buildings.filter(b => isVenueType(b.type)), economic = buildings.filter(b => b.type !== 'casino' && !isVenueType(b.type) && economicPower(b) > 0);
  const factors = factorsAt(state, now);
  const saving = energySavingOf(state);
  const need = new Map(buildings.map(b => [b.id, isHomeType(b.type) ? homePower(b, saving) : economicPower(b, saving)]));
  const supplied = new Map(buildings.map(b => [b.id, 0]));
  const generation = buildings.filter(b => generatedSourceOf(b) !== null);
  const output = (b: Building) => generatorOutput(state, b, factors);
  const outputOf = (source: EnergySourceId) => generation.filter(b => generatedSourceOf(b) === source).reduce((n, b) => n + output(b), 0);
  const surplus = new Map(generation.map(b => [b.id, output(b)]));
  const transfers: { from: number; to: number; amount: number; }[] = [];
  const allocate = (b: Building, amount: number) => {
    const used = Math.max(0, Math.min(need.get(b.id) ?? 0, amount));
    need.set(b.id, (need.get(b.id) ?? 0) - used); supplied.set(b.id, (supplied.get(b.id) ?? 0) + used); return used;
  };
  for (const source of buildings.filter(b => b.solar)) {
    const available = surplus.get(source.id) ?? 0;
    surplus.set(source.id, available - allocate(source, available));
  }
  for (const source of homes.filter(b => b.solar)) {
    let available = surplus.get(source.id) ?? 0;
    for (const home of homes) {
      if (home.id === source.id || distance(source, home) > ECOLOGY.sharingRadius) continue;
      const used = allocate(home, available); available -= used;
      if (used > 0) transfers.push({ from: source.id, to: home.id, amount: used });
    }
    surplus.set(source.id, available);
  }
  const distribute = (targets: Building[], capacity: number) => {
    const demand = targets.reduce((sum, b) => sum + (need.get(b.id) ?? 0), 0);
    const used = Math.min(demand, capacity);
    if (demand > 0) for (const b of targets) allocate(b, used * (need.get(b.id) ?? 0) / demand);
    return used;
  };
  let grid = [...surplus.values()].reduce((n, x) => n + x, 0);
  grid -= distribute(homes, grid); grid -= distribute(economic, grid);
  transitSupplied = Math.min(grid, transitDemand); grid -= transitSupplied;
  grid -= distribute(arcades, grid); grid -= distribute(casinos, grid);
  const beforeGrid = [...surplus.values()].reduce((n, x) => n + x, 0);
  for (const source of generation) surplus.set(source.id, beforeGrid > 0 ? (surplus.get(source.id) ?? 0) * grid / beforeGrid : 0);
  const coalPlants = buildings.filter(b => b.type === PLANT_TYPES.coal);
  const coalCapacity = coalPlants.reduce((sum, b) => sum + (b.coalEnabled !== false ? COAL_CAPACITY[b.tier - 1] ?? 0 : 0), 0);
  const remainingDemand = [...need.values()].reduce((sum, demand) => sum + demand, 0) + transitDemand - transitSupplied;
  const coal = state.urbs > 1e-9 ? Math.min(remainingDemand, coalCapacity) : 0;
  let coalSupplied = distribute(homes, coal);
  coalSupplied += distribute(economic, coal - coalSupplied);
  const transitCoal = Math.min(coal - coalSupplied, transitDemand - transitSupplied);
  transitSupplied += transitCoal;
  coalSupplied += transitCoal;
  coalSupplied += distribute(arcades, coal - coalSupplied); coalSupplied += distribute(casinos, coal - coalSupplied);
  const coalRates = new Map(coalPlants.map(b => [b.id,
    b.coalEnabled !== false && coalCapacity > 0 ? coalSupplied * (COAL_CAPACITY[b.tier - 1] ?? 0) / coalCapacity : 0]));
  const batteries = buildings.filter(b => b.type === 'battery');
  const batteryRates = new Map<number, number>();
  for (const battery of batteries) {
    const nearby = [...homes, ...economic].filter(b => distance(b, battery) <= ECOLOGY.batteryRadius);
    const missing = nearby.reduce((n, b) => n + (need.get(b.id) ?? 0), 0);
    const discharge = (battery.storedEnergy ?? 0) > 1e-9 ? Math.min(ECOLOGY.batteryRate, missing) : 0;
    let used = distribute(nearby.filter(b => isHomeType(b.type)), discharge);
    used += distribute(nearby.filter(b => !isHomeType(b.type)), discharge - used);
    const transitDischarge = (battery.storedEnergy ?? 0) > 1e-9 ? Math.min(ECOLOGY.batteryRate - used, transitDemand - transitSupplied) : 0;
    transitSupplied += transitDischarge; used += transitDischarge;
    batteryRates.set(battery.id, -used);
    if (used > 0 || grid <= 0 || (battery.storedEnergy ?? 0) >= ECOLOGY.batteryCapacity - 1e-9) continue;
    let charge = 0;
    for (const source of generation.filter(b => distance(b, battery) <= ECOLOGY.batteryRadius)) {
      const amount = Math.min(surplus.get(source.id) ?? 0, ECOLOGY.batteryRate - charge);
      charge += amount; surplus.set(source.id, (surplus.get(source.id) ?? 0) - amount);
    }
    batteryRates.set(battery.id, charge); grid -= charge;
  }
  const missing = [...need.values()].reduce((n, x) => n + x, 0) + transitDemand - transitSupplied;
  const backup = state.urbs > 1e-9 ? Math.min(missing, buildings.filter(b => b.type === 'backup').length * ECOLOGY.backupCapacity) : 0;
  let backed = distribute(homes, backup); backed += distribute(economic, backup - backed);
  const transitBackup = Math.min(backup - backed, transitDemand - transitSupplied);
  transitSupplied += transitBackup; backed += transitBackup;
  backed += distribute(arcades, backup - backed); backed += distribute(casinos, backup - backed);
  const demand = homes.reduce((n, b) => n + homePower(b, saving), 0) + economic.reduce((n, b) => n + economicPower(b, saving), 0) + arcades.reduce((n, b) => n + economicPower(b, saving), 0) + casinos.reduce((n, b) => n + economicPower(b, saving), 0) + transitDemand;
  const economicDemand = economic.reduce((n, b) => n + economicPower(b, saving), 0);
  const economicSupplied = economic.reduce((n, b) => n + (supplied.get(b.id) ?? 0), 0);
  const wind = outputOf('wind'), hydro = outputOf('hydro'), geothermal = outputOf('geothermal'), solar = outputOf('solar');
  return {
    demand, transitDemand, transitSupplied, transitRatio: transitDemand > 0 ? transitSupplied / transitDemand : 1, solar, wind, hydro, geothermal, coal: coalSupplied, coalCapacity, coalRates, backup: backed, supplied, transfers, batteryRates, surplus: grid,
    unmet: [...need.values()].reduce((n, x) => n + x, 0) + transitDemand - transitSupplied, economicRatio: economicDemand > 0 ? economicSupplied / economicDemand : 1,
    costPerHour: backed * ECOLOGY.backupCost + coalSupplied * ECOLOGY.coalCost,
    coalCostPerHour: coalSupplied * ECOLOGY.coalCost, coalEmissions: coalSupplied * ECOLOGY.coalEmissions,
    backupEmissions: backed * 2, emissions: backed * 2 + coalSupplied * ECOLOGY.coalEmissions,
    stored: batteries.reduce((n, b) => n + (b.storedEnergy ?? 0), 0), storageCapacity: batteries.length * ECOLOGY.batteryCapacity
  };
}
