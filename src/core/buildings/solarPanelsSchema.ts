import { z } from 'zod';

const count = z.int().min(0);

// One panel on the roof: its Model, its offset in tiles from the center of the footprint (y above the roof) and its angles in degrees.
const solarPanelSchema = z.strictObject({
  model: z.string().regex(/\S/, 'must not be blank').meta({ modelId: true }),
  x: z.number().optional(),
  y: z.number().optional(),
  z: z.number().optional(),
  rotationX: z.number().optional(),
  rotationY: z.number().optional(),
  rotationZ: z.number().optional(),
});

// What it takes to equip a building with Solar panels and how they sit on its roof; a field left out takes the city-wide default, and without panels the roof shows a flat panel on each tile.
export const solarPanelsSchema = z
  .strictObject({
    panels: z.array(solarPanelSchema).optional(),
    cost: count.optional(),
    unlockCitizens: count.optional(),
    output: z.number().positive().optional(),
  })
  .meta({ title: 'Solar panels', description: 'Makes the building eligible for Solar panels.' });

export type SolarPanelsDefinition = z.infer<typeof solarPanelsSchema>;

export type SolarPanelDefinition = z.infer<typeof solarPanelSchema>;
