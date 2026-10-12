import { z } from 'zod';

export const SOLAR_PANEL_STYLES = ['flat', 'landscape'] as const;

export type SolarPanelStyle = (typeof SOLAR_PANEL_STYLES)[number];

const count = z.int().min(0);

// What it takes to equip a building with Solar panels and how they look on its roof; a field left out takes the city-wide default.
export const solarPanelsSchema = z
  .strictObject({
    style: z.enum(SOLAR_PANEL_STYLES).optional(),
    panels: z.int().min(1).max(64).optional(),
    cost: count.optional(),
    unlockCitizens: count.optional(),
    output: z.number().positive().optional(),
    lift: z.number().optional(),
  })
  .meta({ title: 'Solar panels', description: 'Makes the building eligible for Solar panels.' });

export type SolarPanelsDefinition = z.infer<typeof solarPanelsSchema>;
