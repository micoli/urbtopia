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

export const architectShapesSchema = z
  .strictObject({
    ...schemaField,
    shapes: z.record(
      id,
      z.strictObject({
        // The ground floor on the grid, one string per row: `#` is a cell, `.` is empty.
        rows: z.array(z.string().regex(/^[#.]+$/)).min(1),
      }),
    ),
  })
  .refine(({ shapes }) => Object.values(shapes).every(({ rows }) => rows.every(row => row.length === rows.length)), 'a shape is a square grid')
  .meta({ title: 'Architect shapes', description: 'assets/defs/architect/shapes.json: the starting shapes of a house plan.' });

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
