import { GAME_CONFIG } from '../core';
import { gameStore, type createGameStore } from './gameStore';

type GameStoreApi = ReturnType<typeof createGameStore>;

const CHUNK_MS = 60 * 60 * 1000;

let running = false;

const nextFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// Replays a long absence one hour at a time and gives the browser back between hours, so the page keeps answering taps.
// Short gaps (the one-second tick) go straight through. A tick that arrives while a replay runs is dropped: the replay reaches `now` itself.
export async function catchUpInChunks(now: number, store: GameStoreApi = gameStore): Promise<void> {
  if (running) return;
  const gap = now - store.getState().state.lastSeen;
  if (gap <= CHUNK_MS) return store.getState().tick(now);

  running = true;
  try {
    const replayUntil = store.getState().state.lastSeen + Math.min(gap, GAME_CONFIG.offlineCapMs);
    while (store.getState().state.lastSeen < replayUntil) {
      store.getState().tick(Math.min(store.getState().state.lastSeen + CHUNK_MS, replayUntil));
      await nextFrame();
    }
    if (gap > GAME_CONFIG.offlineCapMs) store.getState().forfeitOffline(now);
  } finally {
    running = false;
  }
}
