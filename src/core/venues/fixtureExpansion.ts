import type { FixtureEffect, FixtureSide, FixtureTrait, FixtureVenueKind, FixtureCategory, FactoryFixtureRole, HomeFixtureRole, PortDirection, FixtureMedium } from './venueVocabulary.ts';

// A Fixture shared by several venues is written once, as a template; the game unfolds it into one Fixture per venue, in the flat shape that the venues read.
export interface FixtureTemplateBody {
  name: { en: string; fr: string };
  category: FixtureCategory;
  model: string;
  footprint: readonly [number, number];
  price: number;
  minTier: number;
  wear?: number;
  role?: FactoryFixtureRole | HomeFixtureRole;
  family?: string;
  ports?: readonly { side: FixtureSide; medium: FixtureMedium; direction: PortDirection; optional?: true }[];
  bonuses?: readonly { effect: FixtureEffect; value: number }[];
  traits?: readonly { trait: FixtureTrait; value?: string }[];
  placement?: {
    minRank?: number;
    partition?: true;
    passable?: true;
    onWall?: 'any' | 'back';
    joins?: { elbow: string; tee: string; cross: string };
  };
  visual?: { tint?: string; truck?: string; smoke?: readonly [number, number, number]; hatch?: number };
}

export interface FixtureTemplate extends FixtureTemplateBody {
  venues: readonly FixtureVenueKind[];
  // The id of the Fixture in a venue, when it is not the venue followed by the id of the template.
  ids?: Partial<Record<FixtureVenueKind, string>>;
  // What differs in one venue: each field given replaces the field of the template.
  overrides?: Partial<Record<FixtureVenueKind, Partial<FixtureTemplateBody>>>;
}

export interface ExpandedFixture {
  id: string;
  definition: Record<string, unknown>;
}

export const fixtureIdOf = (venue: string, templateId: string): string => `${venue}${templateId.charAt(0).toUpperCase()}${templateId.slice(1)}`;

const FLAG_TRAITS: readonly FixtureTrait[] = ['heat', 'prep', 'reception', 'picks', 'loud', 'reverses'];

const ON_WALL_FIELDS = { any: 'wall', back: 'wallPort' } as const;

function flatDefinition(venue: string, { bonuses, traits, placement, visual, ...plain }: FixtureTemplateBody): Record<string, unknown> {
  const { onWall, ...rules } = placement ?? {};
  return {
    ...plain,
    kind: 'fixture',
    venue,
    ...Object.fromEntries((bonuses ?? []).map(({ effect, value }) => [effect, value])),
    ...Object.fromEntries((traits ?? []).map(({ trait, value }) => [trait, FLAG_TRAITS.includes(trait) ? true : value])),
    ...rules,
    ...(onWall ? { [ON_WALL_FIELDS[onWall]]: true } : {}),
    ...visual,
  };
}

export function expandFixtureTemplate(templateId: string, { venues, ids, overrides, ...common }: FixtureTemplate): ExpandedFixture[] {
  return venues.map(venue => ({
    id: ids?.[venue] ?? fixtureIdOf(venue, templateId),
    definition: flatDefinition(venue, { ...common, ...overrides?.[venue] }),
  }));
}
