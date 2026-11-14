import { PRODUCTION_INTERIOR_TYPES } from '../../codex/interiorFigures';
import type { GameState } from '../../core';
import { InteriorsRules } from './InteriorsRules';

export function ProductionInteriorsRules({ state }: { state: GameState }) {
  return <InteriorsRules state={state} types={PRODUCTION_INTERIOR_TYPES} title="codex.productionInteriors.title" intro="codex.productionInteriors.intro" />;
}
