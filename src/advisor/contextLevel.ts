export const CONTEXT_LEVELS = [1, 2, 3, 4, 5] as const;
export type ContextLevel = (typeof CONTEXT_LEVELS)[number];
export const DEFAULT_CONTEXT_LEVEL: ContextLevel = 3;

export function isContextLevel(value: unknown): value is ContextLevel {
  return CONTEXT_LEVELS.includes(value as ContextLevel);
}
