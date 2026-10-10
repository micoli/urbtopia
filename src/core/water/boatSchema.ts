import { z } from 'zod';
import { count, filled, localizedText } from '../economy/itemSchemas.ts';

const common = {
  $schema: z.string().optional(),
  kind: z.literal('boat'),
  order: count,
  retired: z.literal(true).optional(),
  name: localizedText,
  model: filled,
  cost: count,
  unlockCitizens: count,
};

// A Boat is bought at a Marina; saved Boats keep only their family, the first live Boat of a family is the one sold.
export const boatSchema = z
  .discriminatedUnion('family', [
    // A pleasure Boat adds Well-being to the Homes within its radius, at an operating cost per hour.
    z.strictObject({ family: z.literal('pleasure'), ...common, radius: z.int().min(1), wellbeingBonus: count, operatingCostPerHour: count }),
    // A fishing Boat brings in fish.
    z.strictObject({ family: z.literal('fishing'), ...common }),
    // A Casino boat follows the Tiers of the Casino.
    z.strictObject({ family: z.literal('casino'), ...common }),
  ])
  .meta({ title: 'Boat', description: 'A Boat moored at a Marina, one file per Boat id in assets/defs/boats.' });

export type BoatDefinition = z.infer<typeof boatSchema>;
