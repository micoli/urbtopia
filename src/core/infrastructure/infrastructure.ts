import bridge from '../../../assets/defs/infrastructure/bridge.json' with { type: 'json' };
import rails from '../../../assets/defs/infrastructure/rails.json' with { type: 'json' };
import roads from '../../../assets/defs/infrastructure/roads.json' with { type: 'json' };
import scenery from '../../../assets/defs/infrastructure/scenery.json' with { type: 'json' };
import { modelFileOf } from '../models/modelFiles';
import type { ROAD_PIECES } from './infrastructureSchemas';

export type RoadPieceName = (typeof ROAD_PIECES)[number];

export const ROAD_PIECE_MODELS = Object.fromEntries(Object.entries(roads.pieces).map(([piece, id]) => [piece, modelFileOf(id)])) as Record<RoadPieceName, string>;

export const RAIL_STRAIGHT_MODEL = modelFileOf(rails.straight);

export const RAIL_CORNER_MODEL = modelFileOf(rails.corner);

export const BRIDGE_ROAD_MODEL = modelFileOf(bridge.road);

export const PARK_TREE_MODEL = modelFileOf(scenery.parkTree);

export const ROOF_PANEL_MODEL = modelFileOf(scenery.roofPanel);

export const GROUND_PANEL_MODEL = modelFileOf(scenery.groundPanel);

export const VENUE_CUSTOMER_MODELS: readonly string[] = scenery.customers.map(modelFileOf);
