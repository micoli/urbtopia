import { transitServices } from './transitService';
import { ECOLOGY, distance, economicPower, homePower } from './ecology';
import { COAL_CAPACITY, UTILITY_CAPACITY } from './economy';
import type { Building, GameState } from './state';

export function productionFactors(now: number) {
  const hour = Math.floor(now / ECOLOGY.hourMs);
  const dayHour = ((hour % 24) + 24) % 24;
  return {
    solar: dayHour >= 6 && dayHour < 18 ? Math.sin(Math.PI * (dayHour - 5.5) / 12) : 0,
    wind: [0.7, 0.9, 1, 0.8, 0.6, 0.75][((hour % 6) + 6) % 6]!
  };
}

export function energyStats(state: GameState, now = state.lastSeen) {
  const transitDemand = transitServices(state, now).reduce((n, line) => n + line.powerDemand, 0);
  let transitSupplied: number;
  const buildings = [...state.buildings].sort((a, b) => a.id - b.id);
  const homes = buildings.filter(b => b.type === 'home'), economic = buildings.filter(b => economicPower(b) > 0);
  const factors = productionFactors(now + (state.timeOffset ?? 0));
  const need = new Map(buildings.map(b => [b.id, b.type === 'home' ? homePower(b) : economicPower(b)]));
  const supplied = new Map(buildings.map(b => [b.id, 0]));
  const generation = buildings.filter(b => b.type === 'solar' || b.type === 'powerPlant' || (b.type === 'home' && b.solar));
  const output = (b: Building) => b.type === 'powerPlant' ? (UTILITY_CAPACITY.powerPlant[b.tier - 1] ?? 0) * factors.wind : (b.type === 'solar' ? 16 : 2 * b.tier) * factors.solar;
  const surplus = new Map(generation.map(b => [b.id, output(b)]));
  const transfers: { from: number; to: number; amount: number; }[] = [];
  const allocate = (b: Building, amount: number) => {
    const used = Math.max(0, Math.min(need.get(b.id) ?? 0, amount));
    need.set(b.id, (need.get(b.id) ?? 0) - used); supplied.set(b.id, (supplied.get(b.id) ?? 0) + used); return used;
  };
  for (const source of homes.filter(b => b.solar)) {
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
  const beforeGrid = [...surplus.values()].reduce((n, x) => n + x, 0);
  for (const source of generation) surplus.set(source.id, beforeGrid > 0 ? (surplus.get(source.id) ?? 0) * grid / beforeGrid : 0);
  const coalPlants = buildings.filter(b => b.type === 'coalPlant');
  const coalCapacity = coalPlants.reduce((sum, b) => sum + (b.coalEnabled !== false ? COAL_CAPACITY[b.tier - 1] ?? 0 : 0), 0);
  const remainingDemand = [...need.values()].reduce((sum, demand) => sum + demand, 0) + transitDemand - transitSupplied;
  const coal = state.urbs > 1e-9 ? Math.min(remainingDemand, coalCapacity) : 0;
  let coalSupplied = distribute(homes, coal);
  coalSupplied += distribute(economic, coal - coalSupplied);
  const transitCoal = Math.min(coal - coalSupplied, transitDemand - transitSupplied);
  transitSupplied += transitCoal;
  coalSupplied += transitCoal;
  const coalRates = new Map(coalPlants.map(b => [b.id,
    b.coalEnabled !== false && coalCapacity > 0 ? coalSupplied * (COAL_CAPACITY[b.tier - 1] ?? 0) / coalCapacity : 0]));
  const batteries = buildings.filter(b => b.type === 'battery');
  const batteryRates = new Map<number, number>();
  for (const battery of batteries) {
    const nearby = [...homes, ...economic].filter(b => distance(b, battery) <= ECOLOGY.batteryRadius);
    const missing = nearby.reduce((n, b) => n + (need.get(b.id) ?? 0), 0);
    const discharge = (battery.storedEnergy ?? 0) > 1e-9 ? Math.min(ECOLOGY.batteryRate, missing) : 0;
    let used = distribute(nearby.filter(b => b.type === 'home'), discharge);
    used += distribute(nearby.filter(b => b.type !== 'home'), discharge - used);
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
  const demand = homes.reduce((n, b) => n + homePower(b), 0) + economic.reduce((n, b) => n + economicPower(b), 0) + transitDemand;
  const economicDemand = economic.reduce((n, b) => n + economicPower(b), 0);
  const economicSupplied = economic.reduce((n, b) => n + (supplied.get(b.id) ?? 0), 0);
  const solar = generation.filter(b => b.type !== 'powerPlant').reduce((n, b) => n + output(b), 0);
  const wind = generation.filter(b => b.type === 'powerPlant').reduce((n, b) => n + output(b), 0);
  return {
    demand, transitDemand, transitSupplied, transitRatio: transitDemand > 0 ? transitSupplied / transitDemand : 1, solar, wind, coal: coalSupplied, coalCapacity, coalRates, backup: backed, supplied, transfers, batteryRates, surplus: grid,
    unmet: [...need.values()].reduce((n, x) => n + x, 0) + transitDemand - transitSupplied, economicRatio: economicDemand > 0 ? economicSupplied / economicDemand : 1,
    costPerHour: backed * ECOLOGY.backupCost + coalSupplied * ECOLOGY.coalCost,
    coalCostPerHour: coalSupplied * ECOLOGY.coalCost, coalEmissions: coalSupplied * ECOLOGY.coalEmissions,
    backupEmissions: backed * 2, emissions: backed * 2 + coalSupplied * ECOLOGY.coalEmissions,
    stored: batteries.reduce((n, b) => n + (b.storedEnergy ?? 0), 0), storageCapacity: batteries.length * ECOLOGY.batteryCapacity
  };
}
