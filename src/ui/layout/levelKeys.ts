export type LevelKeyStep = 1 | -1;

// `[` goes up towards the Surface, `]` goes deeper.
export function levelStepOfKey(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'>): LevelKeyStep | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.key === '[') return -1;
  if (event.key === ']') return 1;
  return null;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}
