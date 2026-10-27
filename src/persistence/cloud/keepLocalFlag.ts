import { isE2eRequested } from '../../store/e2eFlag';

export function isKeepLocalRequested(search: string): boolean {
  return new URLSearchParams(search).has('keep-local') || isE2eRequested(search);
}
