import { z } from 'zod';

const schemaField = { $schema: z.string().optional() };
const price = z.int().min(1);
const tier = z.int().min(1).max(5);
const id = z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/);

export const BRICK_KINDS = ['wall', 'window', 'door', 'extension'] as const;
export const DECOR_PLACEMENTS = ['door', 'shelter', 'any'] as const;

// The bricks a facade is made of: the bare wall, windows, doors, and the parts that stand out of the wall.
export const architectBricksSchema = z
  .strictObject({
    ...schemaField,
    bricks: z.record(
      id,
      z.strictObject({
        // A window or an extension is an opening of its floor; a door goes on the ground floor only.
        kind: z.enum(BRICK_KINDS),
        price,
        // The first Tier of the Architect office that unlocks it.
        tier,
        // The GLB of assets/managed-models/architect, `<type>-<variant>`; a bare wall has none.
        file: z.string().optional(),
      }),
    ),
  })
  .meta({ title: 'Architect bricks', description: 'assets/defs/architect/bricks.json: the bricks of a house plan, in the order of the studio.' });

export const architectDecorsSchema = z
  .strictObject({
    ...schemaField,
    decors: z.record(
      id,
      z.strictObject({
        price,
        tier,
        // The GLB of assets/managed-models/architect.
        file: z.string(),
        // What the decor needs on its edge: a door, a door, a window or a bay to shelter, or nothing.
        placement: z.enum(DECOR_PLACEMENTS),
        // A decor that stands on the ground, so only on the ground floor.
        ground: z.boolean(),
      }),
    ),
  })
  .meta({ title: 'Architect decors', description: 'assets/defs/architect/decors.json: the decors that stand on a facade, in the order of the studio.' });

export const architectRoofsSchema = z
  .strictObject({
    ...schemaField,
    roofs: z.record(
      id,
      z.strictObject({
        // The price of one cell of roof.
        price,
        tier,
        // A contour roof follows the whole footprint, stepped where the floors differ.
        contour: z.boolean(),
      }),
    ),
  })
  .meta({ title: 'Architect roofs', description: 'assets/defs/architect/roofs.json: the roofs of a house plan, in the order of the studio.' });

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/);

export const FACADE_RHYTHMS = ['sparse', 'dense'] as const;
export const MODEL_DECOR_TARGETS = ['door', 'windows', 'walls'] as const;
export const ROOF_PITCHES = ['low', 'normal', 'steep'] as const;

// The starting models of a house plan: a footprint, dressed with floors, colours, a roof and windows, so a new plan looks like a house. The Tier of the office that builds a model follows what it uses.
export const architectShapesSchema = z
  .strictObject({
    ...schemaField,
    shapes: z.record(
      id,
      z.strictObject({
        // The ground floor on the grid, one string per row: `#` is a cell, `.` is empty.
        rows: z.array(z.string().regex(/^[#.]+$/)).min(1),
        floors: z.int().min(1).max(4),
        wallColor: hexColor,
        roofColor: hexColor,
        // The roof of every wing: an id of roofs.json and its pitch.
        roof: z.strictObject({ type: id, pitch: z.enum(ROOF_PITCHES) }),
        // The windows: one wall out of two, or every wall but the door.
        facade: z.enum(FACADE_RHYTHMS),
        // The decors of the ground floor, each on its target: the door, the windows or the bare walls. A decor that cannot stand there is left out.
        decors: z.array(z.strictObject({ decor: id, on: z.enum(MODEL_DECOR_TARGETS) })),
        // A chimney on the first roof wing.
        chimney: z.boolean(),
      }),
    ),
  })
  .refine(({ shapes }) => Object.values(shapes).every(({ rows }) => rows.every(row => row.length === rows.length)), 'a shape is a square grid')
  .meta({ title: 'Architect shapes', description: 'assets/defs/architect/shapes.json: the starting models of a house plan.' });

export const architectPartsSchema = z
  .strictObject({
    ...schemaField,
    cellPrice: price,
    // Added to the cost of a house for each Citizen it lodges.
    citizenPrice: price,
    dormerPrice: price,
    roundDormerPrice: price,
    chimneyPrice: price,
    // The first Tier that unlocks dormers and chimneys.
    dormerTier: tier,
    chimneyTier: tier,
  })
  .meta({ title: 'Architect parts', description: 'assets/defs/architect/parts.json: the price of a cell, of a Citizen lodged, of a dormer and of a chimney, and the Tier that unlocks them.' });
