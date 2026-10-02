export type MigrationStep = (state: unknown) => unknown;

export const MIGRATIONS: Record<number, MigrationStep> = {};

export function migrate(state: unknown, fromVersion: number, toVersion: number, steps: Record<number, MigrationStep> = MIGRATIONS): unknown {
  let current = state;
  for (let version = fromVersion; version < toVersion; version++) {
    const step = steps[version];
    if (!step) throw new Error(`Missing migration from version ${version}`);
    current = step(current);
  }
  return current;
}
