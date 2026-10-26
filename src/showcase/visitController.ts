import type { GameState } from '../core';
import { parseEnvelope, type ParseOptions } from '../persistence/envelope';
import type { VisitFailure, VisitState } from '../store/showcaseStore';
import { ShowcaseError, type ShowcaseClient } from './types';

export interface VisitGame {
  state: () => GameState;
  replaceState: (state: GameState, change: 'tick' | 'reset') => void;
  tick: (now: number) => void;
}

export interface VisitReadOnly {
  get: () => boolean;
  set: (readOnly: boolean) => void;
}

export interface VisitControllerDeps {
  client: ShowcaseClient;
  game: VisitGame;
  readOnly: VisitReadOnly;
  now: () => number;
  onState: (state: VisitState) => void;
  parseOptions?: ParseOptions;
}

interface Home {
  state: GameState;
  wasReadOnly: boolean;
}

export class VisitController {
  private home: Home | null = null;
  private requested = 0;

  constructor(private deps: VisitControllerDeps) {}

  get visiting(): boolean {
    return this.home !== null;
  }

  async visit(userId: string, cityId: string): Promise<void> {
    const request = ++this.requested;
    this.deps.onState({ kind: 'loading', userId });
    const loaded = await this.load(userId, cityId);
    if (request !== this.requested) return;
    if ('failure' in loaded) return this.deps.onState({ kind: 'failed', reason: loaded.failure });
    this.home ??= { state: this.deps.game.state(), wasReadOnly: this.deps.readOnly.get() };
    this.deps.readOnly.set(true);
    this.deps.game.replaceState(loaded.state, 'reset');
    this.deps.onState({ kind: 'visiting', userId, handle: loaded.handle, cityName: loaded.cityName, avatar: loaded.avatar });
  }

  leave(): void {
    this.requested += 1;
    const home = this.home;
    if (!home) return this.deps.onState({ kind: 'idle' });
    this.home = null;
    this.deps.onState({ kind: 'idle' });
    this.deps.game.replaceState(home.state, 'tick');
    if (!home.wasReadOnly) this.deps.readOnly.set(false);
    this.deps.game.tick(this.deps.now());
  }

  // Another tab handed the city back: the game already holds the player's own city again.
  abandon(): void {
    this.requested += 1;
    this.home = null;
    this.deps.onState({ kind: 'idle' });
  }

  private async load(userId: string, cityId: string): Promise<{ state: GameState; handle: string; cityName: string; avatar: string | null } | { failure: VisitFailure }> {
    try {
      const showcase = await this.deps.client.getShowcase(userId, cityId);
      const parsed = parseEnvelope(showcase.envelope, this.deps.parseOptions);
      if (!parsed.ok) return { failure: parsed.reason === 'newer-version' ? 'newer-version' : 'invalid' };
      return { state: parsed.state, handle: showcase.handle, cityName: showcase.cityName, avatar: showcase.avatar };
    } catch (error) {
      if (error instanceof ShowcaseError && error.kind === 'not-found') return { failure: 'not-found' };
      return { failure: 'offline' };
    }
  }
}
