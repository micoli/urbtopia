import type { StoreApi } from 'zustand/vanilla';
import type { Command, ErrorKey, GameState } from '../core';
import type { CommandGateway } from './commandGateway';
import type { GameStore } from './gameStore';

export interface LiveGamePort {
  state: () => GameState;
  apply: (command: Command) => ErrorKey | null;
  persist: () => void;
}

export interface LiveGamePortDeps {
  store: StoreApi<GameStore>;
  gateway: CommandGateway;
  persist: () => void;
}

export function createLiveGamePort({ store, gateway, persist }: LiveGamePortDeps): LiveGamePort {
  return {
    state: () => store.getState().state,
    apply: (command) => {
      const outcome = gateway.apply(store.getState().state, command);
      if (outcome.kind === 'blocked') return 'error.unknownCommand';
      if (outcome.kind === 'rejected') return outcome.error.key;
      store.getState().replaceState(outcome.state, 'command');
      return null;
    },
    persist,
  };
}
