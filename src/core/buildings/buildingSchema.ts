import { z } from 'zod';
import { NATURE_FAMILIES, type NatureFamily } from '../environment/natureFamilies.ts';
import { BUILD_SECTION_TITLES } from './buildSections.ts';
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

export const buildingSchema = z
  .discriminatedUnion('kind', [standardBuilding, sportBuilding, natureBuilding, homeBuilding])
  .refine(building => building.kind === 'nature' || !building.accessModes || building.requiresRoad, { message: 'accessModes needs requiresRoad', path: ['accessModes'] })
  .meta({ title: 'Building', description: 'A building of Urbtopia, one file per building id in assets/defs/buildings.' });

export type BuildingDefinition = z.infer<typeof buildingSchema>;
