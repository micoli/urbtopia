import { BRIDGES, WATER } from '../core';
import type { MessageKey } from '../i18n/messages';

export const WATER_CONSTRUCTIONS = [
  { id: 'water', name: 'water.tile', unlockCitizens: WATER.unlockCitizens },
  { id: 'bridge', name: 'water.bridge', unlockCitizens: BRIDGES.unlockCitizens },
] as const satisfies readonly { id: string; name: MessageKey; unlockCitizens: number }[];

export type WaterConstructionId = typeof WATER_CONSTRUCTIONS[number]['id'];
