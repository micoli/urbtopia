import { z } from 'zod';
import { pairSchema } from '../buildings/tierSchema.ts';
import { count, filled, localizedText } from '../economy/itemSchemas.ts';
import { FACTORY_FIXTURE_ROLES, FIXTURE_CATEGORIES_ALL, FIXTURE_SIDES, HOME_FIXTURE_ROLES, PACK_SIZES, PRODUCTION_INTERIOR_KINDS, SERVICE_INTERIOR_KINDS } from './venueVocabulary.ts';

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
      venue: z.literal('home'),
      ...common,
      // What the piece is in a dwelling, which the Comfort of the Home interior reads.
      role: z.enum(HOME_FIXTURE_ROLES),
      // Leisure and decor: the share of its group it covers, from 0 to 1 excluded.
      comfort: z.number().gt(0).lte(1).optional(),
      // Hangs on a wall segment instead of standing on a tile.
      wall: z.literal(true).optional(),
    }),
    z.strictObject({
      venue: z.enum(SERVICE_INTERIOR_KINDS),
      ...common,
      // What the piece adds to the quality of the service of the School, the Library or the Hospital; it counts in full up to a share of the cap of the Tier, then less and less.
      quality: z.number().positive().optional(),
      // Hangs on a wall segment instead of standing on a tile.
      wall: z.literal(true).optional(),
    }),
    z.strictObject({
      venue: z.enum(PRODUCTION_INTERIOR_KINDS),
      ...common,
      // What the Fixture does on a Factory interior or a Packhouse interior: a Motor and a Pump are the sources of Drive and Flow, Gears, Shafts and Pipes carry them, a Machine uses them.
      role: z.enum(FACTORY_FIXTURE_ROLES).optional(),
      // The sides through which Drive passes or enters, and those through which Flow does.
      drive: z.array(z.enum(FIXTURE_SIDES)).min(1).optional(),
      flow: z.array(z.enum(FIXTURE_SIDES)).min(1).optional(),
      // The sides of a Gear that are its rim: they mesh with the rim of the next Gear, while its other sides are its axle ends, which meet the axle of the next Gear in line. A Motor, a Shaft or a Machine can feed a Gear on any side.
      rim: z.array(z.enum(FIXTURE_SIDES)).min(1).optional(),
      // The direction a Machine needs its Drive to turn; it takes either way when left out.
      turns: z.enum(['cw', 'ccw']).optional(),
      // What a linked Machine adds to the speed and to the yield of the Factory's Slots.
      speed: z.number().positive().optional(),
      // Where smoke rises while the Machine runs, in the model's own space (x, up, z).
      smoke: z.tuple([z.number(), z.number(), z.number()]).optional(),
      yield: z.number().positive().optional(),
      // An Exit of a Line: what it adds to the rate at which the building sells over its Counter, and to what the building holds.
      sales: z.number().positive().optional(),
      // A Machine whose yield only raises one group of the Goods of its building (the Dairy: cheese, cream); it raises them all when left out.
      yieldGroup: z.string().min(1).optional(),
      capacity: z.number().positive().optional(),
      // The role of the Staff that is assigned to the Fixture by hand: a baker to an Oven, a cheesemaker to a Cheese cellar, a cream maker to a Pasteuriser, a seller to a Display counter.
      assigns: z.enum(['baker', 'seller', 'cheesemaker', 'creamMaker', 'miller', 'restocker']).optional(),
      // A Machine at the start of a Line on which the player picks the item that the Line carries: the Extractor of a Workshop.
      picks: z.literal(true).optional(),
      // An Exit of a Line: how far from the middle of its tile, toward its back, the Packets are drawn to go before they vanish; left out, they go through the hatch of the wall.
      hatch: z.number().positive().optional(),
      // The electricity the Fixture draws while it stands in the room, besides what the Motors draw.
      power: z.number().positive().optional(),
      // The kind of a Machine: the Factory interior pays for the variety of kinds that run, not for their number.
      family: z.string().min(1).optional(),
      // A Machine that cools the Motors beside it: the share it adds to the speed and the yield of each Machine they drive.
      coolant: z.number().positive().optional(),
      // A Machine that heats its circuit of Flow, which a coolant on the same circuit then cools twice as well.
      heat: z.literal(true).optional(),
      // Packhouse interior: the sides through which Packets come into a Line Fixture and leave it.
      lineIn: z.array(z.enum(FIXTURE_SIDES)).min(1).optional(),
      lineOut: z.array(z.enum(FIXTURE_SIDES)).min(1).optional(),
      // An Exit: the size of packed Goods it serves.
      packSize: z.enum(PACK_SIZES).optional(),
      // An Exit: the Model of the truck that waits outside it while its Line is linked.
      truck: filled.optional(),
    }),
  ])
  .meta({ title: 'Fixture', description: 'An item placed inside a Venue, one file per Fixture id in assets/defs/fixtures.' });

export type FixtureDefinition = z.infer<typeof fixtureSchema>;
