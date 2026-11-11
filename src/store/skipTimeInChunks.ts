import { gameStore, type createGameStore } from './gameStore';

type GameStoreApi = ReturnType<typeof createGameStore>;

const CHUNK_HOURS = 1;

let skipping = false;

const nextFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// The replay of a long skip runs on the main thread: one hour at a time, with the browser given back between chunks, keeps the page responsive.
export async function skipTimeInChunks(hours: number, store: GameStoreApi = gameStore): Promise<void> {
  if (skipping) return;
  skipping = true;
  try {
    for (let remaining = hours; remaining > 0; remaining -= CHUNK_HOURS) {
      store.getState().send({ type: 'SkipTime', hours: Math.min(CHUNK_HOURS, remaining) });
      if (store.getState().lastError !== null) return;
      await nextFrame();
    }
  } finally {
    skipping = false;
  }
}
