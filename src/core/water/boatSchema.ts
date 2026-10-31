import { z } from 'zod';
import { count, filled, localizedText } from '../economy/itemSchemas.ts';

const amount = z.number().min(0);

const common = {
  $schema: z.string().optional(),
  kind: z.literal('boat'),
  retired: z.literal(true).optional(),
  name: localizedText,
  model: filled,
  cost: count,
  unlockCitizens: count,
};

// A Boat is bought at a Marina or a Pirate cove; saved Boats keep only their family, the first live Boat of a family is the one sold.
export const boatSchema = z
  .discriminatedUnion('family', [
    // A pleasure Boat adds Well-being to the Homes within its radius, at an operating cost per hour.
    z.strictObject({ family: z.literal('pleasure'), ...common, radius: z.int().min(1), wellbeingBonus: count, operatingCostPerHour: count }),
    // A fishing Boat brings in fish.
    z.strictObject({ family: z.literal('fishing'), ...common }),
    // A Casino boat follows the Tiers of the Casino.
    z.strictObject({ family: z.literal('casino'), ...common }),
    // Pirate ships and Navy frigates perform in the Shows of their Pirate cove: each raises what the crowd pays (all but the weakest) and adds to the cost of the Show.
    z.strictObject({ family: z.literal('pirate'), ...common, showBoost: amount, showCost: count }),
    z.strictObject({ family: z.literal('frigate'), ...common, showBoost: amount, showCost: count }),
  ])
  .meta({ title: 'Boat', description: 'A Boat moored at a Marina or a Pirate cove, one file per Boat id in assets/defs/boats.' });

export type BoatDefinition = z.infer<typeof boatSchema>;
