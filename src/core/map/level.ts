export type Level = 0 | -1 | -2;

export const SURFACE: Level = 0;
export const LEVELS: readonly Level[] = [0, -1, -2];
export const UNDERGROUND_LEVELS: readonly Level[] = [-1, -2];

export function isLevel(value: unknown): value is Level {
  return LEVELS.includes(value as Level);
}

export function isUnderground(level: Level): boolean {
  return level < SURFACE;
}

export function levelBelow(level: Level): Level | null {
  const index = LEVELS.indexOf(level);
  return LEVELS[index + 1] ?? null;
}

export function levelAbove(level: Level): Level | null {
  const index = LEVELS.indexOf(level);
  return index > 0 ? (LEVELS[index - 1] ?? null) : null;
}
