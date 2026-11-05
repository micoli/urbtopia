import { createContext, useContext } from 'react';
import type { GameState } from '../../core';

// The state the rule pages show figures for: the live city in the game, a sample city in the Guide.
export const RulesStateContext = createContext<GameState | null>(null);

export function useRulesState(): GameState {
  const state = useContext(RulesStateContext);
  if (!state) throw new Error('useRulesState needs a RulesStateContext');
  return state;
}
