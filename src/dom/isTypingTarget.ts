const TYPING_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];
const KEY_OWNING_ROLES = '[role="combobox"], [role="listbox"]';

// A target that owns the keyboard: typing, or moving through a list with the arrows. The game must not react to its keys.
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || TYPING_TAGS.includes(target.tagName) || target.closest(KEY_OWNING_ROLES) !== null;
}
