import type { ReactNode } from 'react';
import type { GameState } from '../src/core';
import { useGame } from '../src/ui/common/hooks';

export function WithGameState({ children }: { children: (state: GameState) => ReactNode }) {
  const state = useGame((store) => store.state);
  return <>{children(state)}</>;
}
