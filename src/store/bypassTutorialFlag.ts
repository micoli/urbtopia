export function isBypassTutorialRequested(search: string): boolean {
  return new URLSearchParams(search).has('bypass-tutorial');
}
