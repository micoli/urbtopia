import { z } from 'zod';
import { pairSchema } from '../buildings/tierSchema.ts';
import { count, filled, localizedText } from '../economy/itemSchemas.ts';
import { FIXTURE_CATEGORIES_ALL } from './venueVocabulary.ts';

const common = {
  $schema: z.string().optional(),
  kind: z.literal('fixture'),
  order: count,
  name: localizedText,
  category: z.enum(FIXTURE_CATEGORIES_ALL),
  model: filled,
  footprint: pairSchema,
  price: count,
  minTier: z.int().min(1),
  // Rank the Venue must have reached; 1 when left out.
  minRank: z.int().min(1).optional(),
  // Share of the wear its use causes; 1 when left out.
  wear: z.number().min(0).optional(),
  tint: z.string().regex(/^#[0-9a-f]{6}$/i, 'must be #rrggbb').optional(),
  loud: z.literal(true).optional(),
  // A wall only divides the room: it earns, serves and wears nothing.
  partition: z.literal(true).optional(),
  // Decoration: attractiveness it adds.
  attract: z.number().positive().optional(),
};

// What each kind of Venue reads from its Fixtures.
export const fixtureSchema = z
  .discriminatedUnion('venue', [
    z.strictObject({ venue: z.literal('arcade'), ...common, playsPerHour: count }),
    z.strictObject({ venue: z.literal('supermarket'), ...common, shelf: z.int().min(1).optional(), checkout: z.int().min(1).optional() }),
    z.strictObject({
      venue: z.literal('hotel'),
      ...common,
      reception: z.literal(true).optional(),
      sleeps: z.int().min(1).optional(),
      bath: z.int().min(1).optional(),
      comfort: z.number().positive().optional(),
    }),
  ])
  .meta({ title: 'Fixture', description: 'An item placed inside a Venue, one file per Fixture id in assets/defs/fixtures.' });

export type FixtureDefinition = z.infer<typeof fixtureSchema>;
