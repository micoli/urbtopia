import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';

// A Part kind is `<family>-<side>`: its name, then an arrow for the side its slope, jet or belt runs to.
export function partLabel(kind: string): string {
  const split = kind.lastIndexOf('-');
  const family = kind.slice(0, split);
  const arrow = kind.slice(split + 1) === 'left' ? '←' : '→';
  return `${t(`puzzle.part.${family}` as MessageKey)} ${arrow}`;
}
