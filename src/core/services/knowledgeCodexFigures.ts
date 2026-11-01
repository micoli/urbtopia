import { isHomeType } from '../buildings/buildingDefinitions';
import type { GameState } from '../engine/state';
import type { FacilityType } from './facilities';
import { KNOWLEDGE, cityKnowledge, homeKnowledge, knowledgeEffect, type KnowledgeEffectId } from './knowledge';

export interface KnowledgeCodexFigures {
  knowledge: number | null;
  required: number;
  schooling: { type: FacilityType; points: number }[];
  library: { tier: number; points: number }[];
  effects: { id: KnowledgeEffectId; maximum: number; current: number }[];
  homes: number;
  belowRequired: number;
}

export function knowledgeCodexFigures(state: GameState): KnowledgeCodexFigures {
  const homes = state.buildings.filter(building => isHomeType(building.type));
  return {
    knowledge: cityKnowledge(state),
    required: KNOWLEDGE.requiredKnowledge,
    schooling: (Object.entries(KNOWLEDGE.schooling) as [FacilityType, number][]).map(([type, points]) => ({ type, points })),
    library: KNOWLEDGE.library.map((points, index) => ({ tier: index + 1, points })),
    effects: (Object.keys(KNOWLEDGE.effects) as KnowledgeEffectId[]).map(id => ({ id, maximum: KNOWLEDGE.effects[id], current: knowledgeEffect(state, id) })),
    homes: homes.length,
    belowRequired: homes.filter(home => homeKnowledge(state, home) < KNOWLEDGE.requiredKnowledge).length,
  };
}
