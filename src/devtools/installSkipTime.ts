import { cycleHourOf, cycleTimeOf } from '../core';
import { gameStore } from '../store/gameStore';

declare global {
  interface Window {
    skipTime?: (hours: number) => void;
    skipToCycleHour?: (cycleHour: number) => void;
    __gameStore?: typeof gameStore;
  }
}

const CYCLE_HOURS_PER_REAL_HOUR = 12;

// Development console helpers. `__gameStore` is the app's own store, which a console `import()` may not return (Vite can serve another instance).
// `skipTime(0.5)` skips half a real hour, which is 6 Cycle hours of the Day cycle.
// `skipToCycleHour(23.5)` skips forward to 23:30 of the Day cycle.
export function installSkipTime(): void {
  window.__gameStore = gameStore;
  window.skipTime = (hours) => gameStore.getState().send({ type: 'SkipTime', hours });
  window.skipToCycleHour = (cycleHour) => {
    const { state } = gameStore.getState();
    const ahead = (((cycleHour - cycleHourOf(cycleTimeOf(state, state.lastSeen))) % 24) + 24) % 24;
    if (ahead === 0) return;
    gameStore.getState().send({ type: 'SkipTime', hours: ahead / CYCLE_HOURS_PER_REAL_HOUR });
  };
}
