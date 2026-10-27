import { isE2eRequested } from './e2eFlag';

export function isBypassTutorialRequested(search: string): boolean {
  return new URLSearchParams(search).has('bypass-tutorial') || isE2eRequested(search);
}
