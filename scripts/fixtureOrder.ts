import { expandFixtureTemplate, type FixtureTemplate } from '../src/core/venues/fixtureExpansion.ts';
import type { Definition } from './collections.ts';

// The Fixtures that templates unfold into, by id.
export const templateFixtureIds = (templates: Record<string, Definition>): string[] => Object.entries(templates).flatMap(([id, template]) => expandFixtureTemplate(id, template as unknown as FixtureTemplate).map(fixture => fixture.id));

// The order file of the Fixtures lists every Fixture of the game once: those with a file of their own and those that a template unfolds into.
export const listedFixtureIds = (fixtures: Record<string, Definition>, templates: Record<string, Definition>): string[] => [...Object.keys(fixtures), ...templateFixtureIds(templates)];

// Keeps the order of the ids already listed, drops those that are gone, and puts the new ones last.
export function mergedOrder(listed: readonly string[], ids: readonly string[]): string[] {
  const known = new Set(ids);
  const kept = [...new Set(listed)].filter(id => known.has(id));
  const placed = new Set(kept);
  return [...kept, ...ids.filter(id => !placed.has(id))];
}
