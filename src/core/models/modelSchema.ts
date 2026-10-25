import { z } from 'zod';

export const MODEL_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const MODEL_SOURCES = ['quaternius', 'managed'] as const;

const color = z.string().regex(/^#[0-9a-f]{6}$/i, 'must be #rrggbb');

export const modelSchema = z.strictObject({
  file: z.string().regex(/^[^/]+\/.+$/, 'must be <pack>/<name>'),
  source: z.enum(MODEL_SOURCES),
  license: z.string().regex(/\S/, 'is required'),
  author: z.string().optional(),
  url: z.string().optional(),
  footprint: z.tuple([z.int().min(1), z.int().min(1)]).optional(),
  scale: z.number().positive().optional(),
  center: z.tuple([z.number(), z.number()]).optional(),
  fit: z.strictObject({ width: z.number().positive(), height: z.number().positive() }).optional(),
  rotationOffset: z.number().optional(),
  flush: z.boolean().optional().meta({ description: 'A managed model drawn edge to edge over its tile (a road piece): the scene does not inset it.' }),
  tones: z.partialRecord(z.enum(['a', 'b', 'c', 'd']), z.strictObject({ name: z.string(), color })).optional().meta({ description: 'The color tones of this model: the name and swatch of each; a palette PNG `<file>.tone-<x>.png` sits next to it for tones b to d and Repaint swaps the palette texture.' }),
  bakeNodeScale: z.boolean().optional(),
  recolor: z.strictObject({ color, variants: z.record(z.string(), color).optional() }).optional(),
  note: z.string().optional(),
});

export const modelsFileSchema = z
  .object({ $schema: z.string().optional() })
  .catchall(modelSchema)
  .meta({ title: 'Model definitions', description: 'assets/models.json: one entry per Model id, its file and how the game shows it.' });

export type ModelSource = (typeof MODEL_SOURCES)[number];
export type ModelEntry = z.infer<typeof modelSchema>;
