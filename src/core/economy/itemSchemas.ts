import { z } from 'zod';

// Item ids are concatenated into pack ids (`carrotCrate`), so they hold no hyphen.
export const ITEM_ID_PATTERN = /^[a-z][A-Za-z0-9]*$/;

export const filled = z.string().regex(/\S/, 'must not be blank');
export const count = z.int().min(0);
export const localizedText = z.strictObject({ en: filled, fr: filled });
const minutes = z.number().positive();

const common = {
  $schema: z.string().optional(),
  order: count,
  name: localizedText,
  // The model its icon is drawn from.
  model: filled.optional(),
};

export const GOOD_CATEGORIES = ['construction', 'food', 'equipment', 'luxury'] as const;

export const MATERIAL_PRODUCERS = ['workshop', 'fishingBoat'] as const;

export const materialSchema = z
  .strictObject({
    kind: z.literal('material'),
    ...common,
    producedBy: z.enum(MATERIAL_PRODUCERS),
    durationMinutes: minutes,
    unlockCitizens: count,
    minTier: z.int().min(1),
  })
  .meta({ title: 'Material', description: 'A raw resource, one file per Material id in assets/defs/materials. Crop Materials come from assets/defs/crops.' });

export const goodSchema = z
  .strictObject({
    kind: z.literal('good'),
    ...common,
    category: z.enum(GOOD_CATEGORIES),
    recipe: z.record(z.string(), z.int().min(1)).refine(recipe => Object.keys(recipe).length > 0, 'needs at least one Material'),
    durationMinutes: minutes,
    value: count,
    unlockCitizens: count,
    minTier: z.int().min(1),
  })
  .meta({ title: 'Good', description: 'A Good made by a Factory, one file per Good id in assets/defs/goods. Crop packs are derived from crops and pack formats.' });

export const packFormatsSchema = z
  .strictObject({
    $schema: z.string().optional(),
    formats: z.array(z.strictObject({ suffix: z.string().regex(/^[A-Z][A-Za-z]*$/, 'must be a capitalised word'), size: z.int().min(1), valueBonus: z.number().positive() })).min(1),
  })
  .meta({ title: 'Pack formats', description: 'assets/defs/packFormats.json: how the Packhouse packs a Crop Material into Goods.' });

export type MaterialDefinition = z.infer<typeof materialSchema>;
export type GoodCategory = (typeof GOOD_CATEGORIES)[number];
export type GoodDefinition = z.infer<typeof goodSchema>;
export type PackFormats = z.infer<typeof packFormatsSchema>;
