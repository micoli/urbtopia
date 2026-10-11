export function isKeepLocalRequested(search: string): boolean {
  return new URLSearchParams(search).has('keep-local');
}
