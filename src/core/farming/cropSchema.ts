import { z } from 'zod';
import { count, filled, localizedText } from '../economy/itemSchemas.ts';

export const cropSchema = z
  .strictObject({
    $schema: z.string().optional(),
    kind: z.literal('crop'),
    order: count,
    name: localizedText,
    growthMinutes: z.number().positive(),
    water: count,
    yield: z.int().min(1),
    seedShare: z.number().min(0).max(1),
    seedPrice: count,
    unlockCitizens: count,
    packingMinutes: z.number().positive(),
    packedValue: count,
    // Four growth stages, then the produce left on a ready tile and the harvested heap, when the pack has them.
    models: z.strictObject({ growth: z.tuple([filled, filled, filled, filled]), produce: filled.optional(), harvested: filled.optional() }),
  })
  .meta({ title: 'Crop', description: 'A Crop species, one file per Crop id in assets/defs/crops. It is also a Material.' });

export type CropDefinition = z.infer<typeof cropSchema>;
