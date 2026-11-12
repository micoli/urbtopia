import { definitionOf } from '../buildings/buildingDefinitions';
import { entriesOf } from '../defs/entries';
import fixtureOrder from '../../../assets/defs/order/fixtures.json' with { type: 'json' };
import type { FixtureId, VenueType } from '../engine/state';
import { modelFileOf } from '../models/modelFiles';
import type { FixtureDefinition } from './fixtureSchema';
import { VENUE_TYPES } from './profiles';
import { FACTORY_FIXTURE_CATEGORIES, HOME_FIXTURE_CATEGORIES, LINE_FIXTURE_CATEGORIES, PACKHOUSE_FIXTURE_CATEGORIES, type PRODUCTION_INTERIOR_KINDS, type FactoryFixtureRole, type HomeFixtureRole, type FixtureCategory, type FixtureSide, type PackSize } from './venueVocabulary';

export type { FixtureCategory };

// The sections of the build menu of each kind of Venue, in order.
export const FIXTURE_CATEGORIES = {
  ...(Object.fromEntries(VENUE_TYPES.map(type => [type, definitionOf(type).fixtureCategories!])) as unknown as Record<VenueType, readonly FixtureCategory[]>),
  factory: FACTORY_FIXTURE_CATEGORIES,
  packhouse: PACKHOUSE_FIXTURE_CATEGORIES,
  mill: FACTORY_FIXTURE_CATEGORIES,
  bakery: LINE_FIXTURE_CATEGORIES,
  dairy: LINE_FIXTURE_CATEGORIES,
  storehouse: PACKHOUSE_FIXTURE_CATEGORIES,
  home: HOME_FIXTURE_CATEGORIES,
} as Record<FixtureVenue, readonly FixtureCategory[]>;

// What a Fixture can be placed in: a Venue, a Factory interior, a Packhouse interior or a Home interior.
export type FixtureVenue = VenueType | (typeof PRODUCTION_INTERIOR_KINDS)[number] | 'home';

export interface FixtureSpec {
  venue: FixtureVenue;
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
  // Restaurant: dishes a cooktop cooks per hour, a prep table, the kind of host a seat faces, seats a table serves,
  // drinks and stools of a bar, Diners a checkout takes payment from and an armchair holds while they wait.
  cook?: number;
  prep?: true;
  seat?: 'table' | 'bar';
  seats?: number;
  drinks?: number;
  stools?: number;
  waiting?: number;
  // Decoration: attractiveness it adds.
  attract?: number;
  // Factory interior: what the Fixture does, the sides through which Drive and Flow pass, the direction a Machine needs its Drive to turn,
  // and what a linked Machine adds to the speed and the yield of the Factory's Slots.
  role?: FactoryFixtureRole | HomeFixtureRole;
  // Home interior: the Fixture hangs on a wall segment.
  wall?: true;
  drive?: readonly FixtureSide[];
  flow?: readonly FixtureSide[];
  rim?: readonly FixtureSide[];
  turns?: 'cw' | 'ccw';
  speed?: number;
  smoke?: readonly [number, number, number];
  yield?: number;
  sales?: number;
  yieldGroup?: string;
  capacity?: number;
  family?: string;
  coolant?: number;
  heat?: true;
  // Packhouse interior: the sides through which Packets come into a Line Fixture and leave it, and the size of packed Goods an Exit serves.
  lineIn?: readonly FixtureSide[];
  lineOut?: readonly FixtureSide[];
  packSize?: PackSize;
  truck?: string;
  // A wall: it only divides the room, and earns, serves and wears nothing.
  partition?: true;
  joins?: { elbow: string; tee: string; cross: string };
}

// Checked against their schema by the definitions plugin at dev start and build, and by the tests.
const files = import.meta.glob<FixtureDefinition>('../../../assets/defs/fixtures/*.json', { eager: true, import: 'default' });

const specOf = ({ id: _id, kind: _kind, name: _name, model, tint, footprint, joins, ...fixture }: FixtureDefinition & { id: FixtureId }): FixtureSpec => ({
  playsPerHour: 0,
  ...fixture,
  model: modelFileOf(model),
  ...('truck' in fixture && fixture.truck ? { truck: modelFileOf(fixture.truck) } : {}),
  footprint: [footprint[0], footprint[1]],
  ...(joins ? { joins: { elbow: modelFileOf(joins.elbow), tee: modelFileOf(joins.tee), cross: modelFileOf(joins.cross) } } : {}),
  ...(tint ? { tint: Number.parseInt(tint.slice(1), 16) } : {}),
});

export const FIXTURE_ENTRIES = entriesOf<FixtureDefinition, FixtureId>(files, fixtureOrder);

export const FIXTURES = Object.fromEntries(FIXTURE_ENTRIES.map(entry => [entry.id, specOf(entry)])) as Record<FixtureId, FixtureSpec>;

export const FIXTURE_IDS = Object.keys(FIXTURES) as FixtureId[];

export const fixtureIdsOf = (venue: FixtureVenue): FixtureId[] => FIXTURE_IDS.filter(id => FIXTURES[id].venue === venue);

export const fixtureIdsInCategory = (venue: FixtureVenue, category: FixtureCategory): FixtureId[] => fixtureIdsOf(venue).filter(id => FIXTURES[id].category === category);

export const FIXTURE_MODELS: readonly string[] = [...new Set(Object.values(FIXTURES).flatMap(spec => [spec.model, ...(spec.truck ? [spec.truck] : []), ...(spec.joins ? Object.values(spec.joins) : [])]))];
