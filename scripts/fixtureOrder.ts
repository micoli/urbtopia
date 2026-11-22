import { expandFixtureTemplate, type FixtureTemplate } from '../src/core/venues/fixtureExpansion.ts';
import type { Definition } from './collections.ts';

// The order of the Fixtures of the game, one id per line, lives beside the order files of the collections.
export const FIXTURE_ORDER_FILE = 'assets/defs/order/fixtures.json';

// The Fixtures that templates unfold into, by id.
export const templateFixtureIds = (templates: Record<string, Definition>): string[] => Object.entries(templates).flatMap(([id, template]) => expandFixtureTemplate(id, template as unknown as FixtureTemplate).map(fixture => fixture.id));

// Keeps the order of the ids already listed, drops those that are gone, and puts the new ones last.
export function mergedOrder(listed: readonly string[], ids: readonly string[]): string[] {
  const known = new Set(ids);
  const kept = [...new Set(listed)].filter(id => known.has(id));
  const placed = new Set(kept);
  return [...kept, ...ids.filter(id => !placed.has(id))];
}
