import { z } from 'zod';
import { NATURE_FAMILIES, type NatureFamily } from '../environment/natureFamilies.ts';
import { BUILD_SECTION_TITLES } from './buildSections.ts';
import { CASINO_GAMES } from '../leisure/casinoGames.ts';
import { SERVICE_CATEGORIES } from '../services/serviceCategories.ts';
import { pairSchema, tiersOf, variantsOf } from './tierSchema.ts';

export const BUILDING_ID_PATTERN = /^[a-z][A-Za-z0-9-]*$/;

const filled = z.string().regex(/\S/, 'must not be blank');
const count = z.int().min(0);
const localizedText = z.strictObject({ en: filled, fr: filled });

const meta = {
  $schema: z.string().optional(),
  order: count,
  // Retired: no longer built nor unlocked, but still loaded in the cities that have it.
  retired: z.literal(true).optional(),
};

const text = { name: localizedText, description: localizedText.optional() };

const identity = { ...meta, ...text };

const common = { ...meta, model: filled, ...text };

const sited = {
  section: z.enum(BUILD_SECTION_TITLES),
  cost: count,
  unlockCitizens: count,
  requiresRoad: z.boolean(),
  accessModes: z.array(z.enum(['road', 'brt'])).min(1).optional(),
  initialSlots: count.optional(),
};

const placed = { ...common, ...sited, footprint: pairSchema };

const standardBuilding = z.strictObject({ kind: z.literal('standard'), ...placed });

// A sport venue's only effect is a Well-being radius.
const sportBuilding = z.strictObject({ kind: z.literal('sport'), ...placed, radius: z.int().min(1), wellbeingBonus: count });

// Section, footprint, cost, unlock and benefits come from the nature family.
const natureBuilding = z.strictObject({ kind: z.literal('nature'), ...common, family: z.enum(Object.keys(NATURE_FAMILIES) as [NatureFamily, ...NatureFamily[]]) });

const homeLook = { model: filled, footprint: pairSchema };

// A Home grows through its Tiers: each sets its look, its Citizens and its power and water Demand.
const homeBuilding = z.strictObject({
  kind: z.literal('home'),
  ...identity,
  ...sited,
  tiers: tiersOf({ ...homeLook, citizens: count, power: count, water: count }, ['model', 'footprint', 'citizens', 'power', 'water']),
  variants: variantsOf(homeLook).optional(),
});

// Workshop, Factory, Packhouse: a higher Tier crafts faster, holds more Slots and yields more per cycle.
const productionBuilding = z.strictObject({
  kind: z.literal('production'),
  ...identity,
  ...sited,
  tiers: tiersOf({ ...homeLook, durationFactor: z.number().positive(), maxSlots: z.int().min(1), yield: z.int().min(1) }, ['model', 'footprint', 'durationFactor', 'maxSlots', 'yield']),
});

// The Farm holds the seed stock and bounds the number of Field tiles.
const farmBuilding = z.strictObject({
  kind: z.literal('farm'),
  ...identity,
  ...sited,
  tiers: tiersOf({ ...homeLook, seedCapacity: count, fieldCap: count }, ['model', 'footprint', 'seedCapacity', 'fieldCap']),
});

// Storehouse, Silo, Vault, Grain silo: the capacity each Tier adds to each compartment, summed over the city's storages.
const storageBuilding = z.strictObject({
  kind: z.literal('storage'),
  ...identity,
  ...sited,
  tiers: tiersOf({ ...homeLook, materials: count, goods: count, crops: count }, ['model', 'footprint', 'materials', 'goods', 'crops']),
});

// Power plant, Water tower, Coal Power plant: the power or water Capacity of each Tier.
const utilityBuilding = z.strictObject({
  kind: z.literal('utility'),
  ...identity,
  ...sited,
  tiers: tiersOf({ ...homeLook, capacity: count }, ['model', 'footprint', 'capacity']),
});

const positive = z.number().positive();

// A Solar installation's power at full daylight.
const solarBuilding = z.strictObject({ kind: z.literal('solar'), ...placed, output: positive });

// A Neighborhood battery stores surplus and feeds nearby Demand, within its radius, at its rate per hour.
const batteryBuilding = z.strictObject({ kind: z.literal('battery'), ...placed, storage: positive, rate: positive, radius: z.int().min(1) });

// A Backup Power plant supplies deficits, up to its capacity per hour, at a cost in Urbs per unit.
const backupBuilding = z.strictObject({ kind: z.literal('backup'), ...placed, capacity: positive, costPerUnit: positive });

// A Public facility serves the Homes within its radius (the whole city without one), up to the Citizen capacity of its Tier (unlimited without one).
const facilityBuilding = z.strictObject({
  kind: z.literal('facility'),
  ...identity,
  ...sited,
  category: z.enum(SERVICE_CATEGORIES),
  radius: z.int().min(1).optional(),
  power: count,
  water: count,
  // Only one can be built.
  unique: z.literal(true).optional(),
  tiers: tiersOf({ ...homeLook, capacity: z.int().min(1) }, ['model', 'footprint']),
});

// The Casino: Stake steps, the Tier each Minigame opens at, and per Tier its reach, Well-being bonus, highest Stake, power and blockmatch level.
const casinoBuilding = z.strictObject({
  kind: z.literal('casino'),
  ...identity,
  ...sited,
  stakeSteps: z.array(z.int().min(1)).min(1),
  gameMinTier: z.strictObject(Object.fromEntries(CASINO_GAMES.map(game => [game, z.int().min(1)])) as Record<(typeof CASINO_GAMES)[number], z.ZodInt>),
  tiers: tiersOf(
    { ...homeLook, radius: z.int().min(1), wellbeingBonus: count, maxStake: z.int().min(1), power: positive, blockmatchLevel: z.int().min(1) },
    ['model', 'footprint', 'radius', 'wellbeingBonus', 'maxStake', 'power', 'blockmatchLevel'],
  ),
});

export const buildingSchema = z
  .discriminatedUnion('kind', [standardBuilding, sportBuilding, natureBuilding, homeBuilding, productionBuilding, farmBuilding, storageBuilding, utilityBuilding, solarBuilding, batteryBuilding, backupBuilding, facilityBuilding, casinoBuilding])
  .refine(building => building.kind === 'nature' || !building.accessModes || building.requiresRoad, { message: 'accessModes needs requiresRoad', path: ['accessModes'] })
  .meta({ title: 'Building', description: 'A building of Urbtopia, one file per building id in assets/defs/buildings.' });

export type BuildingDefinition = z.infer<typeof buildingSchema>;

export const BUILDING_KINDS = buildingSchema.options.map(option => option.shape.kind.value);
