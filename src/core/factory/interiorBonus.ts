import interiorBalance from '../../../assets/defs/balance/factoryInterior.json' with { type: 'json' };
import packhouseBalance from '../../../assets/defs/balance/packhouseInterior.json' with { type: 'json' };
import { FIXTURES } from '../venues/fixtures';
import { distanceBetween } from '../venues/layout';
import { type PackSize } from '../venues/venueVocabulary';
import type { ItemId } from '../economy/items';
import type { Building, BuildingType, VenueFixture } from '../engine/state';
import { interiorProfileOf } from '../interiors/interiorProfile';
import { valueByTier } from '../interiors/valueByTier';
import { interiorDeclarationOf, interiorLayoutOf, interiorPartPresence, isProducerRole, yieldGroupOf, type InteriorPart } from '../interiors/interiorStaff';
import { memoizedByLayout } from './memoizedByLayout';
import { circuitOf, interiorReportOf, isMachine, roleOf } from './interiorLinks';
import { suppliedGoodsOf } from './interiorLine';

export interface InteriorCaps {
  speed: number;
  yield: number;
}

export interface InteriorBonus {
  speed: number;
  yield: number;
  // The Line of a Bakery or a Storehouse: what its linked Exits add to the rate at which the building sells over its Counter, and to what it holds.
  sales?: number;
  capacity?: number;
  // What the Motors of the floor ask of the city's power.
  power: number;
}

// The highest speed and yield bonus a floor can approach at a Tier.
export const interiorCapsOf = (tier: number): InteriorCaps => ({ speed: valueByTier(interiorBalance.speedCaps, tier), yield: valueByTier(interiorBalance.yieldCaps, tier) });

export const interiorGridSizeOf = (tier: number): number => valueByTier(interiorBalance.gridSizes, tier);

// The highest speed and yield bonus, and what the Exits of a Line add to the sales and to the room, that the interior of a Production building can approach at a Tier.
export const interiorCapsOfType = (type: BuildingType, tier: number): InteriorCaps & { sales?: number; capacity?: number } => interiorProfileOf(type)?.caps(tier) ?? interiorCapsOf(tier);

// The room, the caps and the Technician posts of a Production interior other than the Factory's, by Tier.
export const interiorGridSizeOfType = (type: BuildingType, tier: number): number => interiorProfileOf(type)?.gridSize(tier) ?? interiorGridSizeOf(tier);

export const packhouseGridSizeOf = (tier: number): number => valueByTier(packhouseBalance.gridSizes, tier);

// The most Exits of each size a Packhouse interior can have at a Tier.
export const packhouseExitLimitOf = (tier: number): number => valueByTier(packhouseBalance.exitLimits, tier);

// A bonus counts in full up to a share of the cap of the Factory's Tier, then grows with every Machine but less and less, and never reaches the cap.
function saturate(total: number, cap: number, kneeShare = interiorBalance.bonusKnee): number {
  const knee = cap * kneeShare;
  return total <= knee ? total : cap - (cap - knee) * Math.exp(-(total - knee) / (cap - knee));
}

// How the Cooling vats of a floor act on its Machines: a vat that is linked cools the Motors beside it, and a Boiler that runs on its circuit of Flow doubles that.
const coolingOf = memoizedByLayout(allFixtures => {
  const { fixtures, at, drive, links } = interiorReportOf(allFixtures);
  const { linked } = links;
  const machines = fixtures.filter(fixture => linked.has(fixture.id));
  const motors = fixtures.filter(fixture => roleOf(fixture) === 'motor');
  const coolants = machines.filter(fixture => FIXTURES[fixture.type].coolant !== undefined);
  const heated = (coolant: VenueFixture): boolean => circuitOf(coolant, at).some(next => linked.has(next.id) && FIXTURES[next.type].heat);
  const cooled = (coolant: VenueFixture): number => FIXTURES[coolant.type].coolant! * (heated(coolant) ? interiorBalance.coolingLoopFactor : 1);
  const besideMotor = (coolant: VenueFixture): VenueFixture[] => motors.filter(motor => distanceBetween(coolant, motor) === 1);
  const coolingOfMotor = (motor: VenueFixture): number => Math.max(0, ...coolants.filter(coolant => distanceBetween(coolant, motor) === 1).map(cooled));
  const coolantOf = (machine: VenueFixture): number => Math.max(0, ...motors.filter(motor => drive.served.get(motor.id)?.handed.has(machine.id)).map(coolingOfMotor));
  return { fixtures, at, linked, drive, machines, motors, coolants, heated, cooled, besideMotor, coolingOfMotor, coolantOf };
});

// What the linked Machines add to the speed and to the yield of the Factory's Slots, each rising towards the cap of the Factory's Tier, and what the Motors draw, less what the Boilers that run save.
// A Motor drives only so many Machines and Pumps, and the others stop; the kinds of Machine that run add to the yield, and a Cooling vat beside a Motor adds to the Machines that Motor drives.
const bonuses = new WeakMap<readonly VenueFixture[], Map<string, InteriorBonus>>();

export function interiorBonusOf(allFixtures: readonly VenueFixture[], tier: number, type: BuildingType = 'factory'): InteriorBonus {
  const perTier = bonuses.get(allFixtures) ?? new Map<string, InteriorBonus>();
  bonuses.set(allFixtures, perTier);
  const key = `${type}:${tier}`;
  const cached = perTier.get(key);
  if (cached) return cached;
  const bonus = bonusOf(allFixtures, tier, type);
  perTier.set(key, bonus);
  return bonus;
}

function bonusOf(allFixtures: readonly VenueFixture[], tier: number, type: BuildingType): InteriorBonus {
  const caps = interiorCapsOfType(type, tier);
  const { machines, motors, drive, coolantOf } = coolingOf(allFixtures);
  const saving = Math.min(interiorBalance.maxPowerSaving, interiorBalance.boilerPowerSaving * machines.filter(fixture => FIXTURES[fixture.type].heat).length);
  const busy = motors.length === 0 ? 0 : Math.min(1, drive.received.size / (motors.length * interiorBalance.motorCapacity));
  const sum = (key: 'speed' | 'yield') => machines.reduce((total, fixture) => total + (FIXTURES[fixture.type][key] ?? 0) * (1 + coolantOf(fixture)), 0);
  const fixturePower = allFixtures.filter(fixture => fixture.broken !== true).reduce((total, fixture) => total + (FIXTURES[fixture.type].power ?? 0), 0);
  const variety = interiorBalance.varietyYield * Math.max(0, kindsOf(machines) - 1);
  return {
    speed: saturate(sum('speed'), caps.speed),
    yield: saturate(sum('yield') + variety, caps.yield),
    power: motors.length * interiorBalance.motorPower * (interiorBalance.idlePowerShare + (1 - interiorBalance.idlePowerShare) * busy) * (1 - saving) + fixturePower,
  };
}

// What the Motors of a Packhouse interior ask of the city's power, as those of a Factory interior do: all of it when the Machines they drive run, a share of it at rest.
const packhousePowerOf = memoizedByLayout((allFixtures): number => {
  const { fixtures, drive } = interiorReportOf(allFixtures);
  const motors = fixtures.filter(fixture => roleOf(fixture) === 'motor');
  if (motors.length === 0) return 0;
  const busy = Math.min(1, drive.received.size / (motors.length * interiorBalance.motorCapacity));
  return motors.length * interiorBalance.motorPower * (interiorBalance.idlePowerShare + (1 - interiorBalance.idlePowerShare) * busy);
});

// What the Motors of a building's floor ask of the city's power.
export const interiorPowerOfBuilding = (building: Pick<Building, 'type' | 'tier' | 'interior' | 'breakerOff'>): number => {
  if (!building.interior || building.breakerOff) return 0;
  return building.type === 'packhouse' ? packhousePowerOf(building.interior.fixtures) : interiorBonusOf(building.interior.fixtures, building.tier, building.type).power;
};

const lineBonuses = new WeakMap<readonly VenueFixture[], Map<string, InteriorBonus>>();

// What the Line of a Bakery, a Dairy or a Storehouse adds, from the Machines and the Exits that Packets reach: their speed and yield (the Exits' for a Bakery), and the sales and the capacity of the Exits,
// each saturating towards the cap of its Tier. Nothing counts until the Line is unbroken from its first Machine to an Exit.
export function lineBonusOf(allFixtures: readonly VenueFixture[], tier: number, type: BuildingType, group?: string): InteriorBonus {
  const perKey = lineBonuses.get(allFixtures) ?? new Map<string, InteriorBonus>();
  lineBonuses.set(allFixtures, perKey);
  const key = `${type}:${tier}:${group ?? ''}`;
  const cached = perKey.get(key);
  if (cached) return cached;
  const layout = interiorLayoutOf(type);
  const caps = interiorCapsOfType(type, tier);
  const { fixtures, links } = interiorReportOf(allFixtures);
  const lined = fixtures.filter(fixture => links.lined.has(fixture.id));
  const exits = lined.filter(fixture => roleOf(fixture) === 'exit');
  const power = bonusOf(allFixtures, tier, type).power;
  let bonus: InteriorBonus = { speed: 0, yield: 0, sales: 0, capacity: 0, power };
  if (layout && exits.length > 0) {
    const machines = lined.filter(isMachine);
    const total = (list: readonly VenueFixture[], key: 'speed' | 'yield' | 'sales' | 'capacity') => list.reduce((sum, fixture) => sum + (FIXTURES[fixture.type][key] ?? 0), 0);
    bonus = {
      speed: saturate(total(machines, 'speed'), caps.speed, interiorBalance.bonusKnee),
      yield: saturate(layout.yieldFromExits ? total(exits, 'yield') : total(machines.filter(fixture => group === undefined || FIXTURES[fixture.type].yieldGroup === undefined || FIXTURES[fixture.type].yieldGroup === group), 'yield'), caps.yield, interiorBalance.bonusKnee),
      sales: caps.sales === undefined ? 0 : saturate(total(exits, 'sales'), caps.sales, interiorBalance.bonusKnee),
      capacity: caps.capacity === undefined ? 0 : saturate(total(exits, 'capacity'), caps.capacity, interiorBalance.bonusKnee),
      power,
    };
  }
  perKey.set(key, bonus);
  return bonus;
}

const packBonuses = new WeakMap<readonly VenueFixture[], Map<string, InteriorBonus>>();

export const packSizeOf = (item: ItemId): PackSize | null => (['Crate', 'Box', 'Pallet'] as const).find(size => item.endsWith(size)) ?? null;

// What the Line of a Packhouse interior adds to the speed and the yield of the Slots that pack a size of Goods: only the Packers and Strappers that Packets leave through
// an Exit of that size count, each Strapper beyond the first adds to the yield, and with no size asked it is the best that a size gets. The power its Motors draw is
// told apart, by `interiorPowerOfBuilding`.
export function packhouseBonusOf(allFixtures: readonly VenueFixture[], tier: number, size?: PackSize | null): InteriorBonus {
  const perKey = packBonuses.get(allFixtures) ?? new Map<string, InteriorBonus>();
  packBonuses.set(allFixtures, perKey);
  const key = `${tier}:${size === undefined ? 'any' : size === null ? 'none' : size}`;
  const cached = perKey.get(key);
  if (cached) return cached;
  const bonus = packhouseBonusUncached(allFixtures, tier, size);
  perKey.set(key, bonus);
  return bonus;
}

function packhouseBonusUncached(allFixtures: readonly VenueFixture[], tier: number, size?: PackSize | null): InteriorBonus {
  const { fixtures, links } = interiorReportOf(allFixtures);
  const lined = fixtures.filter(fixture => links.lined.has(fixture.id));
  const served = new Set(lined.filter(fixture => roleOf(fixture) === 'exit').map(fixture => FIXTURES[fixture.type].packSize));
  if (size === null || (size === undefined ? served.size === 0 : !served.has(size))) return NO_BONUS;
  const machines = lined.filter(isMachine);
  const strappers = machines.filter(fixture => FIXTURES[fixture.type].family === 'strapper').length;
  const sum = (key: 'speed' | 'yield') => machines.reduce((total, fixture) => total + (FIXTURES[fixture.type][key] ?? 0), 0);
  return {
    speed: saturate(sum('speed'), valueByTier(packhouseBalance.speedCaps, tier), packhouseBalance.bonusKnee),
    yield: saturate(sum('yield') + packhouseBalance.strapperSeriesYield * Math.max(0, strappers - 1), valueByTier(packhouseBalance.yieldCaps, tier), packhouseBalance.bonusKnee),
    power: 0,
  };
}

const kindsOf = (machines: readonly VenueFixture[]): number => new Set(machines.map(fixture => FIXTURES[fixture.type].family ?? fixture.type)).size;

export interface InteriorBenefits {
  // What a linked Machine adds to the speed and to the yield, cooling included.
  speed: number;
  yield: number;
  // The share of cooling that reaches a Machine, or that a Motor passes to the Machines it drives, or that a Cooling vat gives.
  cooling: number;
  // The Motors beside a Cooling vat, and the linked Machines they drive.
  coolsMotors: number;
  coolsMachines: number;
  // A Cooling vat on a circuit with a Boiler that runs.
  doubled: boolean;
  // A Boiler: the Cooling vats on its circuit.
  heatsVats: number;
  // The yield that the kinds of Machine that run add to the floor.
  variety: number;
  // A Boiler: the share of the Motors' power it saves.
  powerSaving: number;
}

// What a Fixture of a Factory interior brings to the floor, beyond the Drive and the Flow it passes on.
export function interiorBenefitsOf(allFixtures: readonly VenueFixture[], fixture: VenueFixture): InteriorBenefits {
  const context = coolingOf(allFixtures);
  const spec = FIXTURES[fixture.type];
  const isLinked = context.linked.has(fixture.id);
  const none: InteriorBenefits = { speed: 0, yield: 0, cooling: 0, coolsMotors: 0, coolsMachines: 0, doubled: false, heatsVats: 0, variety: 0, powerSaving: 0 };
  if (roleOf(fixture) === 'motor') return { ...none, cooling: context.coolingOfMotor(fixture), coolsMachines: [...(context.drive.served.get(fixture.id)?.handed ?? [])].filter(id => context.linked.has(id)).length };
  if (!isLinked) return none;
  const cooling = context.coolantOf(fixture);
  const vatMotors = spec.coolant === undefined ? [] : context.besideMotor(fixture);
  const circuit = spec.heat ? circuitOf(fixture, context.at).filter(next => context.linked.has(next.id) && FIXTURES[next.type].coolant !== undefined) : [];
  return {
    speed: (spec.speed ?? 0) * (1 + cooling),
    yield: (spec.yield ?? 0) * (1 + cooling),
    cooling: spec.coolant === undefined ? cooling : context.cooled(fixture),
    coolsMotors: vatMotors.length,
    coolsMachines: new Set(vatMotors.flatMap(motor => [...(context.drive.served.get(motor.id)?.handed ?? [])].filter(id => context.linked.has(id)))).size,
    doubled: spec.coolant !== undefined && context.heated(fixture),
    heatsVats: circuit.length,
    variety: spec.venue === 'packhouse' || spec.venue === 'workshop' ? 0 : interiorBalance.varietyYield * Math.max(0, kindsOf(context.machines) - 1),
    powerSaving: spec.heat ? interiorBalance.boilerPowerSaving : 0,
  };
}

const NO_BONUS: InteriorBonus = { speed: 0, yield: 0, power: 0 };

// A Bakery adds its bonus Good by Good, through the Staff assigned to its Fixtures: an Oven adds its speed to the productions of its Recipe, and a Display counter its sales and its yield
// to the sales of its Sold Good, each saturating towards the cap of the Tier. The Mixer, which no Staff serves, adds its speed to every Recipe that is baked. Asked about no Good, it is the best of them.
const assignedBonuses = new WeakMap<readonly VenueFixture[], Map<string, InteriorBonus>>();

function assignedBonusOf(building: Pick<Building, 'type' | 'tier' | 'interior'>, item?: ItemId): InteriorBonus {
  const fixtures = building.interior!.fixtures;
  const perKey = assignedBonuses.get(fixtures) ?? new Map<string, InteriorBonus>();
  assignedBonuses.set(fixtures, perKey);
  const key = `${building.type}:${building.tier}:${item ?? ''}`;
  const known = perKey.get(key);
  if (known) return known;
  const bonus = assignedBonusUncached(building, item);
  perKey.set(key, bonus);
  return bonus;
}

function assignedBonusUncached(building: Pick<Building, 'type' | 'tier' | 'interior'>, item?: ItemId): InteriorBonus {
  const caps = interiorCapsOfType(building.type, building.tier);
  const allFixtures = building.interior!.fixtures;
  const { links } = interiorReportOf(allFixtures);
  // The report is cached by layout, which leaves out what the player assigns: the Fixtures are read from the interior itself.
  const lined = allFixtures.filter(fixture => links.lined.has(fixture.id));
  const ovens = lined.filter(fixture => fixture.assigned === true && isProducerRole(FIXTURES[fixture.type].assigns) && fixture.recipe !== undefined);
  const counters = lined.filter(fixture => fixture.assigned === true && FIXTURES[fixture.type].assigns === 'seller' && fixture.soldGood !== undefined && suppliedGoodsOf(allFixtures, fixture).has(fixture.soldGood));
  const unattended = lined.filter(fixture => isMachine(fixture) && FIXTURES[fixture.type].assigns === undefined);
  const total = (list: readonly VenueFixture[], key: 'speed' | 'yield' | 'sales') => list.reduce((sum, fixture) => sum + (FIXTURES[fixture.type][key] ?? 0), 0);
  const speedOf = (good: string) => {
    const baking = ovens.filter(oven => oven.recipe === good);
    return baking.length === 0 ? 0 : saturate(total(baking, 'speed') + total(unattended, 'speed'), caps.speed, interiorBalance.bonusKnee);
  };
  const sellingOf = (good: string, key: 'yield' | 'sales', cap: number | undefined) => (cap === undefined ? 0 : saturate(total(counters.filter(counter => counter.soldGood === good), key), cap, interiorBalance.bonusKnee));
  const best = (values: readonly number[]) => Math.max(0, ...values);
  const baked = [...new Set(ovens.map(oven => oven.recipe!))];
  const sold = [...new Set(counters.map(counter => counter.soldGood!))];
  return {
    speed: item === undefined ? best(baked.map(speedOf)) : speedOf(item),
    yield: item === undefined ? best(sold.map(good => sellingOf(good, 'yield', caps.yield))) : sellingOf(item, 'yield', caps.yield),
    sales: item === undefined ? best(sold.map(good => sellingOf(good, 'sales', caps.sales))) : sellingOf(item, 'sales', caps.sales),
    capacity: 0,
    power: bonusOf(allFixtures, building.tier, building.type).power,
  };
}

// The Staff that delivers the yield the Exits add: the sellers of a Bakery, the herders of a Livestock farm.
const exitYieldPartOf = (type: BuildingType): InteriorPart => (Object.values(interiorDeclarationOf(type)?.roles ?? {}).some(role => role.part === 'yield') ? 'yield' : 'salesRate');

// The bonus of a building's floor; for a Packhouse, the one that applies to the packed Goods `item` when it is given.
export function interiorBonusOfBuilding(building: Pick<Building, 'type' | 'tier' | 'interior' | 'breakerOff'>, item?: ItemId): InteriorBonus {
  if (!building.interior || building.breakerOff) return NO_BONUS;
  const bonusModel = interiorDeclarationOf(building.type)?.bonusModel;
  if (bonusModel === 'packhouse') return packhouseBonusOf(building.interior.fixtures, building.tier, item === undefined ? undefined : packSizeOf(item));
  if (bonusModel === 'factory') return interiorBonusOf(building.interior.fixtures, building.tier, building.type);
  if (bonusModel === 'assigned') return assignedBonusOf(building, item);
  if (interiorDeclarationOf(building.type)) {
    const layout = interiorLayoutOf(building.type);
    const groups = Object.keys(layout?.yieldGroups ?? {});
    const group = item === undefined ? undefined : yieldGroupOf(building.type, item);
    const bonus = bonusModel === 'line' ? lineBonusOf(building.interior.fixtures, building.tier, building.type, group) : interiorBonusOf(building.interior.fixtures, building.tier, building.type);
    // A yield that comes from the Exits is delivered by the Staff that serves them. A building that splits its yield in groups of Goods delivers each group through its own role; asked about none, it is the best of them.
    const delivered = (name: string) => bonus.yield * interiorPartPresence(building, `${name}Yield` as InteriorPart);
    const yieldShare = groups.length === 0 ? bonus.yield * (layout?.yieldFromExits ? interiorPartPresence(building, exitYieldPartOf(building.type)) : 1) : group !== undefined ? delivered(group) : item !== undefined ? 0 : Math.max(...groups.map(delivered));
    return {
      ...bonus,
      yield: yieldShare,
      speed: bonus.speed * interiorPartPresence(building, 'speed'),
      ...(bonus.sales === undefined ? {} : { sales: bonus.sales * interiorPartPresence(building, 'salesRate') }),
      ...(bonus.capacity === undefined ? {} : { capacity: bonus.capacity * interiorPartPresence(building, 'capacity') }),
    };
  }
  return interiorBonusOf(building.interior.fixtures, building.tier, building.type);
}
