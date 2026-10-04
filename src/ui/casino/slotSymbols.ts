import type { SlotSymbol } from '../../core';

export const SLOT_SYMBOL_GLYPHS: Record<SlotSymbol, string> = {
  cherry: '🍒',
  lemon: '🍋',
  bell: '🔔',
  bar: '🟫',
  star: '⭐',
  seven: '7️⃣',
};

const SLOT_STOP_FIRST_MS = 600;
const SLOT_STOP_STEP_MS = 350;
const SLOT_SETTLE_MS = 200;

export const SLOT_TICK_MS = 70;

export const slotStopAt = (reel: number) => SLOT_STOP_FIRST_MS + reel * SLOT_STOP_STEP_MS;

export const slotSpinDuration = (reelCount: number) => slotStopAt(reelCount - 1) + SLOT_SETTLE_MS;
