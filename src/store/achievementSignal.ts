import type { AchievementSignal } from '../core';
import { gameStore } from './gameStore';

// Tells the open City that the player did something the game state does not hold.
export function sendAchievementSignal(signal: AchievementSignal): void {
  gameStore.getState().send({ type: 'Signal', signal });
}
