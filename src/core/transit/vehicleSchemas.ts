import { z } from 'zod';
import { count, filled, localizedText } from '../economy/itemSchemas.ts';

const common = { $schema: z.string().optional(), order: count, name: localizedText };

const positive = z.number().positive();

// The bus only needs its model; the BRT and the trains are bought, powered and paid per hour.
export const transitVehicleSchema = z
  .discriminatedUnion('mode', [
    z.strictObject({ kind: z.literal('transitVehicle'), mode: z.literal('bus'), ...common, model: filled }),
    z.strictObject({
      kind: z.literal('transitVehicle'),
      mode: z.enum(['brt', 'rail']),
      ...common,
      propulsion: z.enum(['electric', 'coal']),
      price: count,
      // Power Demand while running, coal burnt per hour, operating cost per hour and emissions.
      power: count,
      coal: count,
      cost: count,
      emissions: count,
      // Lead and trailing cars.
      models: z.tuple([filled, filled]),
    }),
  ])
  .meta({ title: 'Transit vehicle', description: 'A vehicle of a transit mode, one file per vehicle id in assets/defs/transitVehicles.' });

export type TransitVehicleDefinition = z.infer<typeof transitVehicleSchema>;

// A car of the ambient traffic: the share of the cars it makes up follows its weight.
export const trafficVehicleSchema = z
  .strictObject({ kind: z.literal('trafficVehicle'), ...common, model: filled, weight: positive })
  .meta({ title: 'Traffic vehicle', description: 'A car driving on the roads, one file per car id in assets/defs/trafficVehicles.' });

export type TrafficVehicleDefinition = z.infer<typeof trafficVehicleSchema>;

// The vehicle a Public facility sends to the Homes it serves.
export const serviceVehicleSchema = z
  .strictObject({ kind: z.literal('serviceVehicle'), ...common, facility: filled, model: filled })
  .meta({ title: 'Service vehicle', description: 'A vehicle sent by a Public facility, one file per vehicle id in assets/defs/serviceVehicles.' });

export type ServiceVehicleDefinition = z.infer<typeof serviceVehicleSchema>;
