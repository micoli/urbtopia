import { SERVICE_INTERIOR_TYPES } from '../../codex/interiorFigures';
import type { GameState } from '../../core';
import { InteriorsRules } from './InteriorsRules';

export function ServiceInteriorsRules({ state }: { state: GameState }) {
  return <InteriorsRules state={state} types={SERVICE_INTERIOR_TYPES} title="codex.serviceInteriors.title" intro="codex.serviceInteriors.intro" />;
}
