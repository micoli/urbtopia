import { GAME_CONFIG, TRANSIT } from '../core';
import type { MessageKey } from '../i18n/messages';
import type { Tool } from '../tools/tools';

export const ROAD_CONSTRUCTIONS = [
  { id: 'road', name: 'tool.road', unlockCitizens: 0, cost: GAME_CONFIG.roadCostPerTile, perTile: true, tool: { kind: 'road', start: null, horizontalFirst: true } },
  { id: 'crossing', name: 'tool.crossing', unlockCitizens: 0, cost: GAME_CONFIG.crossingCost, perTile: false, tool: { kind: 'crossing' } },
  { id: 'roundabout', name: 'tool.roundabout', unlockCitizens: 0, cost: GAME_CONFIG.roundaboutCost, perTile: false, tool: { kind: 'roundabout' } },
  { id: 'brt', name: 'tool.brt', unlockCitizens: TRANSIT.brt.unlock, cost: TRANSIT.brt.tileCost, perTile: true, tool: { kind: 'road', mode: 'brt', start: null, horizontalFirst: true } },
  { id: 'rail', name: 'tool.rail', unlockCitizens: TRANSIT.rail.unlock, cost: TRANSIT.rail.tileCost, perTile: true, tool: { kind: 'road', mode: 'rail', start: null, horizontalFirst: true } },
] as const satisfies readonly { id: string; name: MessageKey; unlockCitizens: number; cost: number; perTile: boolean; tool: Tool }[];

export type RoadConstructionId = typeof ROAD_CONSTRUCTIONS[number]['id'];
