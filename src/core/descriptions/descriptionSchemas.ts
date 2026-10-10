import { z } from 'zod';
import { NATURE_FAMILIES, type NatureFamily } from '../environment/natureFamilies.ts';
import { localizedText } from '../economy/itemSchemas.ts';

const families = Object.fromEntries(Object.keys(NATURE_FAMILIES).map(family => [family, localizedText])) as Record<NatureFamily, typeof localizedText>;

// What a family of nature elements tells in the codex; its templates may use the family's own numbers.
export const natureDescriptionsSchema = z
  .strictObject({ $schema: z.string().optional(), families: z.strictObject(families) })
  .meta({ title: 'Nature descriptions', description: 'assets/defs/descriptions/nature.json: the codex description of each family of nature elements.' });

export const NATURE_DESCRIPTION_VALUES = ['radius'] as const;
