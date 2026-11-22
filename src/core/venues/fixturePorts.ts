import type { FixtureSide, FixtureMedium, PortDirection } from './venueVocabulary';
import type { FixtureSpec } from './fixtures';

const sidesOn = (spec: Pick<FixtureSpec, 'ports'>, media: readonly FixtureMedium[], direction?: PortDirection): readonly FixtureSide[] =>
  (spec.ports ?? []).filter(port => media.includes(port.medium) && (direction === undefined || port.direction === direction)).map(port => port.side);

// The sides through which Drive passes or enters: those of a Gear's rim among them.
export const driveSidesOf = (spec: Pick<FixtureSpec, 'ports'>): readonly FixtureSide[] => sidesOn(spec, ['drive', 'gear']);

// The sides of a Gear that are its rim: they mesh with the rim of the next Gear.
export const rimSidesOf = (spec: Pick<FixtureSpec, 'ports'>): readonly FixtureSide[] => sidesOn(spec, ['gear']);

export const flowSidesOf = (spec: Pick<FixtureSpec, 'ports'>): readonly FixtureSide[] => sidesOn(spec, ['flow']);

// The sides through which Packets come into a Line Fixture, and those through which they leave it.
export const lineInSidesOf = (spec: Pick<FixtureSpec, 'ports'>): readonly FixtureSide[] => sidesOn(spec, ['line'], 'in');

export const lineOutSidesOf = (spec: Pick<FixtureSpec, 'ports'>): readonly FixtureSide[] => sidesOn(spec, ['line'], 'out');
