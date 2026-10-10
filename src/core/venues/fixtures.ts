import { definitionOf } from '../buildings/buildingDefinitions';
import { entriesOf } from '../defs/entries';
import type { FixtureId, VenueType } from '../engine/state';
import { modelFileOf } from '../models/modelFiles';
import type { FixtureDefinition } from './fixtureSchema';
import { VENUE_TYPES } from './profiles';
import type { FixtureCategory } from './venueVocabulary';

export type { FixtureCategory };

// The sections of the build menu of each kind of Venue, in order.
export const FIXTURE_CATEGORIES = Object.fromEntries(VENUE_TYPES.map(type => [type, definitionOf(type).fixtureCategories!])) as unknown as Record<VenueType, readonly FixtureCategory[]>;

export interface FixtureSpec {
  venue: VenueType;
  category: FixtureCategory;
  model: string;
  footprint: readonly [number, number];
  price: number;
  minTier: number;
  // Rank the Venue must have reached; 1 when left out.
  minRank?: number;
  // Arcade: plays per hour of a game.
  playsPerHour: number;
  tint?: number;
  loud?: true;
  // Share of the wear that the use of the Fixture causes; 1 when left out.
  wear?: number;
  // Supermarket: units a shelf holds, and shoppers a checkout serves per hour.
  shelf?: number;
  checkout?: number;
  // Hotel: reception desk, guests a bed sleeps, rooms a bathroom piece serves, comfort points of an extra.
  reception?: true;
  sleeps?: number;
  bath?: number;
  comfort?: number;
  // Decoration: attractiveness it adds.
  attract?: number;
  // A wall: it only divides the room, and earns, serves and wears nothing.
  partition?: true;
}

// Checked against their schema by the definitions plugin at dev start and build, and by the tests.
const files = import.meta.glob<FixtureDefinition>('../../../assets/defs/fixtures/*.json', { eager: true, import: 'default' });

const specOf = ({ id: _id, kind: _kind, order: _order, name: _name, model, tint, footprint, ...fixture }: FixtureDefinition & { id: FixtureId }): FixtureSpec => ({
  playsPerHour: 0,
  ...fixture,
  model: modelFileOf(model),
  footprint: [footprint[0], footprint[1]],
  ...(tint ? { tint: Number.parseInt(tint.slice(1), 16) } : {}),
});

export const FIXTURE_ENTRIES = entriesOf<FixtureDefinition, FixtureId>(files);

export const FIXTURES = Object.fromEntries(FIXTURE_ENTRIES.map(entry => [entry.id, specOf(entry)])) as Record<FixtureId, FixtureSpec>;

export const FIXTURE_IDS = Object.keys(FIXTURES) as FixtureId[];

export const fixtureIdsOf = (venue: VenueType): FixtureId[] => FIXTURE_IDS.filter(id => FIXTURES[id].venue === venue);

export const fixtureIdsInCategory = (venue: VenueType, category: FixtureCategory): FixtureId[] => fixtureIdsOf(venue).filter(id => FIXTURES[id].category === category);

export const FIXTURE_MODELS: readonly string[] = [...new Set(Object.values(FIXTURES).map(spec => spec.model))];
