import { dispatch, type Command, type CommandError, type GameEvent, type GameState } from '../core';
import type { DeletionUndo } from '../core/engine/undo';
import type { MessageKey } from '../i18n/messages';

type EventType = GameEvent['type'];
export type EventHandler<T extends EventType> = (event: Extract<GameEvent, { type: T }>) => void;

export type GatewayOutcome =
  | { kind: 'blocked' }
  | { kind: 'rejected'; error: CommandError }
  | { kind: 'applied'; state: GameState; undo: DeletionUndo | null };

export interface CommandGatewayDeps {
  isReadOnly: () => boolean;
  now: () => number;
  // Whether the feature a command belongs to is switched on; a command of a feature that is off is refused.
  isCommandEnabled?: (command: Command) => boolean;
  announceEvents: (events: GameEvent[], state: GameState) => void;
  showToast: (key: MessageKey) => void;
}

export interface CommandGateway {
  apply: (state: GameState, command: Command) => GatewayOutcome;
  onEvent: <T extends EventType>(type: T, handler: EventHandler<T>) => () => void;
}

export function tutorialEndToast(before: GameState, after: GameState): MessageKey | null {
  return before.tutorial === 'tax' && after.tutorial === null ? 'tutorial.done' : null;
}

export function createCommandGateway(deps: CommandGatewayDeps): CommandGateway {
  const handlers = new Map<EventType, Set<(event: GameEvent) => void>>();

  return {
    onEvent: (type, handler) => {
      const registered = handler as (event: GameEvent) => void;
      const forType = handlers.get(type) ?? new Set();
      forType.add(registered);
      handlers.set(type, forType);
      return () => void forType.delete(registered);
    },
    apply: (state, command) => {
      if (deps.isReadOnly()) return { kind: 'blocked' };
      if (deps.isCommandEnabled && !deps.isCommandEnabled(command)) return { kind: 'rejected', error: { key: 'error.unknownCommand' } };
      const result = dispatch(state, command, deps.now());
      if (!result.ok) return { kind: 'rejected', error: result.error };
      deps.announceEvents(result.events, result.state);
      for (const event of result.events) handlers.get(event.type)?.forEach((handler) => handler(event));
      const tutorialEnd = tutorialEndToast(state, result.state);
      if (tutorialEnd) deps.showToast(tutorialEnd);
      return { kind: 'applied', state: result.state, undo: result.undo };
    },
  };
}
