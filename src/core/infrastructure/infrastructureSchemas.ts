import { z } from 'zod';
import { filled } from '../economy/itemSchemas.ts';

// Shown as a model picker by the editor.
const modelId = filled.meta({ modelId: true });

const schemaField = { $schema: z.string().optional() };

export const ROAD_PIECES = ['square', 'end', 'straight', 'bend', 'intersection', 'crossroad', 'crossing', 'roundabout'] as const;

const pieces = Object.fromEntries(ROAD_PIECES.map(piece => [piece, modelId])) as Record<(typeof ROAD_PIECES)[number], typeof modelId>;

// The model of each piece of road, also used for the BRT lanes.
export const roadsInfrastructureSchema = z
  .strictObject({ ...schemaField, pieces: z.strictObject(pieces) })
  .meta({ title: 'Roads', description: 'assets/defs/infrastructure/roads.json: the Model id of each piece of road.' });

// A rail tile is a straight piece or a small corner.
export const railsInfrastructureSchema = z
  .strictObject({ ...schemaField, straight: modelId, corner: modelId })
  .meta({ title: 'Rails', description: 'assets/defs/infrastructure/rails.json: the Model ids of the rail pieces.' });

export const bridgeInfrastructureSchema = z
  .strictObject({ ...schemaField, road: modelId })
  .meta({ title: 'Bridge', description: 'assets/defs/infrastructure/bridge.json: the Model id of a bridge approach.' });

// What the scene places around buildings and in Venues, owned by no Game object.
export const sceneryInfrastructureSchema = z
  .strictObject({
    ...schemaField,
    parkTree: modelId,
    roofPanel: modelId,
    groundPanel: modelId,
    // Visitors of every Venue: women and men alternate so neighbours differ.
    customers: z.array(modelId).min(1),
  })
  .meta({ title: 'Scenery', description: 'assets/defs/infrastructure/scenery.json: park trees, solar panels and Venue visitors.' });
