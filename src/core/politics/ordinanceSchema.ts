import { z } from 'zod';
import { count, localizedText } from '../economy/itemSchemas.ts';
import { FACTION_IDS } from './factions.ts';

const share = z.number().gt(0).max(1);

// How much a Faction welcomes an Ordinance for its concern: -2 opposes strongly, 2 supports strongly.
const stance = z.int().min(-2).max(2);

// The family of rules in code that applies the Ordinance, with the values it reads.
const effectSchema = z.discriminatedUnion('kind', [
  // Multiplies the Tax of every Home.
  z.strictObject({ kind: z.literal('taxMultiplier'), multiplier: z.number().positive() }),
  // Lowers the Waste produced by every Home.
  z.strictObject({ kind: z.literal('wasteSorting'), reduction: share }),
  // Raises the Well-being of the Homes next to a Green space.
  z.strictObject({ kind: z.literal('greenBelt'), wellbeingBonus: z.int().min(1) }),
  // Lowers the Congestion of the Commute.
  z.strictObject({ kind: z.literal('transitSubsidy'), congestionRelief: share }),
  // Lowers the power Demand of every building.
  z.strictObject({ kind: z.literal('energySaving'), demandReduction: share }),
  // Multiplies the Urbs produced by the Office buildings.
  z.strictObject({ kind: z.literal('officeRelief'), yieldMultiplier: z.number().gt(1) }),
  // Raises the Esteem Need level.
  z.strictObject({ kind: z.literal('culturalFestival'), esteemBonus: z.int().min(1) }),
]);

export const ordinanceSchema = z
  .strictObject({
    $schema: z.string().optional(),
    name: localizedText,
    description: localizedText,
    // Citizens needed in the city before the Ordinance can be proposed.
    unlockCitizens: count,
    // Urbs paid every game day while the Ordinance is adopted.
    upkeepPerDay: count,
    // Whether Citizens like it: repealing a popular Ordinance lowers the Approval.
    popular: z.boolean(),
    // Ordinances of the same group exclude each other.
    exclusiveGroup: z.string().min(1).optional(),
    stances: z.strictObject(Object.fromEntries(FACTION_IDS.map(id => [id, stance])) as Record<(typeof FACTION_IDS)[number], typeof stance>),
    effect: effectSchema,
  })
  .meta({ title: 'Ordinance', description: 'An Ordinance the Mayor proposes to the Council, one file per Ordinance id in assets/defs/ordinances.' });

export type OrdinanceDefinition = z.infer<typeof ordinanceSchema>;
export type OrdinanceEffect = OrdinanceDefinition['effect'];
