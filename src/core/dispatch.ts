import type { GameState } from './state';

export interface Command {
  readonly type: string;
}

export interface GameEvent {
  readonly type: string;
}

export interface CommandError {
  key: string;
}

export type DispatchResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: CommandError; state: GameState };

export function dispatch(state: GameState, _command: Command, _now: number): DispatchResult {
  return { ok: false, error: { key: 'error.unknownCommand' }, state };
}
