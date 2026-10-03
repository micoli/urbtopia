export function isSimulationRequested(search: string): boolean {
  return import.meta.env.DEV && new URLSearchParams(search).has('simulation');
}
