export function isE2eRequested(search: string): boolean {
  return new URLSearchParams(search).has('e2e');
}
