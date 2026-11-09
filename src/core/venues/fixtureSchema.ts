import { z } from 'zod';
import { pairSchema } from '../buildings/tierSchema.ts';
import { count, filled, localizedText } from '../economy/itemSchemas.ts';
import { FACTORY_FIXTURE_ROLES, FIXTURE_CATEGORIES_ALL, FIXTURE_SIDES } from './venueVocabulary.ts';

const common = {
  $schema: z.string().optional(),
  kind: z.literal('fixture'),
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
  // The pieces a wall turns into where it meets other walls; a wall without them stays straight.
  joins: z.strictObject({ elbow: filled, tee: filled, cross: filled }).optional(),
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
    z.strictObject({
      venue: z.literal('restaurant'),
      ...common,
      // Dishes a cooktop can cook per hour.
      cook: z.int().min(1).optional(),
      // A table next to a cooktop speeds it up.
      prep: z.literal(true).optional(),
      // A seat: what it must face to count, and the Diners it holds.
      seat: z.enum(['table', 'bar']).optional(),
      // Seats a table can serve.
      seats: z.int().min(1).optional(),
      // Drinks a bar serves per hour, and the stools it can serve.
      drinks: z.int().min(1).optional(),
      stools: z.int().min(1).optional(),
      // Diners a checkout takes payment from per hour.
      checkout: z.int().min(1).optional(),
      // Diners an armchair holds while they wait for a seat.
      waiting: z.int().min(1).optional(),
    }),
    z.strictObject({
      venue: z.literal('factory'),
      ...common,
      // What the Fixture does on a Factory floor: a Motor and a Pump are the sources of Drive and Flow, Gears, Shafts and Pipes carry them, a Machine uses them.
      role: z.enum(FACTORY_FIXTURE_ROLES).optional(),
      // The sides through which Drive passes or enters, and those through which Flow does.
      drive: z.array(z.enum(FIXTURE_SIDES)).min(1).optional(),
      flow: z.array(z.enum(FIXTURE_SIDES)).min(1).optional(),
      // The direction a Machine needs its Drive to turn; it takes either way when left out.
      turns: z.enum(['cw', 'ccw']).optional(),
      // What a linked Machine adds to the speed and to the yield of the Factory's Slots.
      speed: z.number().positive().optional(),
      yield: z.number().positive().optional(),
    }),
  ])
  .meta({ title: 'Fixture', description: 'An item placed inside a Venue, one file per Fixture id in assets/defs/fixtures.' });

export type FixtureDefinition = z.infer<typeof fixtureSchema>;
