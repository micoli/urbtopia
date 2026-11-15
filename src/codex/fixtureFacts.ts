import { FIXTURES, type FixtureId, type FixtureSpec } from '../core';
import type { MessageKey } from '../i18n/messages';
import type { FixturePage } from './fixturePages';

export interface FactLine {
  key: MessageKey;
  values?: Record<string, string>;
  // Names that the text lists, each given by its message key.
  names?: Record<string, readonly MessageKey[]>;
}

export interface FixtureFacts {
  interiors: readonly FixtureSpec['venue'][];
  description: readonly FactLine[];
  usage: readonly FactLine[];
}

export interface FixtureFigure {
  key: MessageKey;
  value: string;
}

export interface FixtureInteriorRow {
  id: FixtureId;
  spec: FixtureSpec;
  figures: readonly FixtureFigure[];
}

const percentOf = (value: number): string => `${Math.round(value * 1000) / 10}%`;

const FIGURES: readonly { field: keyof FixtureSpec; key: MessageKey; format: (value: number) => string }[] = [
  { field: 'attract', key: 'codex.fixtures.figure.attract', format: percentOf },
  { field: 'quality', key: 'codex.fixtures.figure.quality', format: percentOf },
  { field: 'capacity', key: 'codex.fixtures.figure.capacity', format: percentOf },
  { field: 'speed', key: 'codex.fixtures.figure.speed', format: percentOf },
  { field: 'yield', key: 'codex.fixtures.figure.yield', format: percentOf },
  { field: 'sales', key: 'codex.fixtures.figure.sales', format: percentOf },
  { field: 'coolant', key: 'codex.fixtures.figure.coolant', format: percentOf },
  { field: 'wear', key: 'codex.fixtures.figure.wear', format: percentOf },
  { field: 'comfort', key: 'codex.fixtures.figure.comfort', format: String },
  { field: 'playsPerHour', key: 'codex.fixtures.figure.playsPerHour', format: String },
  { field: 'shelf', key: 'codex.fixtures.figure.shelf', format: String },
  { field: 'checkout', key: 'codex.fixtures.figure.checkout', format: String },
  { field: 'cook', key: 'codex.fixtures.figure.cook', format: String },
  { field: 'seats', key: 'codex.fixtures.figure.seats', format: String },
  { field: 'drinks', key: 'codex.fixtures.figure.drinks', format: String },
  { field: 'stools', key: 'codex.fixtures.figure.stools', format: String },
  { field: 'waiting', key: 'codex.fixtures.figure.waiting', format: String },
  { field: 'sleeps', key: 'codex.fixtures.figure.sleeps', format: String },
  { field: 'bath', key: 'codex.fixtures.figure.bath', format: String },
];

const HOME_ROLES: readonly string[] = ['bed', 'table', 'chair', 'stove', 'sink', 'washer', 'toilet'];

const descriptionOf = (spec: FixtureSpec): FactLine => {
  if (spec.partition) return { key: 'codex.fixtures.about.partition' };
  if (spec.role && HOME_ROLES.includes(spec.role)) return { key: 'codex.fixtures.about.home' };
  if (spec.role === 'leisure' || spec.role === 'decor') return { key: 'codex.fixtures.about.homeLeisure' };
  if (spec.role) return { key: `codex.fixtures.about.role.${spec.role}` as MessageKey };
  return { key: `codex.fixtures.about.category.${spec.category}` as MessageKey };
};

const sidesOf = (sides: readonly string[]): readonly MessageKey[] => sides.map(side => `codex.fixtures.side.${side}` as MessageKey);

const usageOf = (spec: FixtureSpec): FactLine[] => [
  { key: 'codex.fixtures.use.place', names: { category: [`venue.category.${spec.category}`] } },
  ...(spec.wall ? [{ key: 'codex.fixtures.use.wall' } as FactLine] : []),
  ...(spec.picks ? [{ key: 'codex.fixtures.use.picks' } as FactLine] : []),
  ...(spec.assigns ? [{ key: 'codex.fixtures.use.assigns', names: { role: [`interior.role.${spec.assigns}` as MessageKey] } } as FactLine] : []),
  ...(spec.drive ? [{ key: 'codex.fixtures.use.drive', names: { sides: sidesOf(spec.drive) } } as FactLine] : []),
  ...(spec.turns ? [{ key: `codex.fixtures.use.turns.${spec.turns}` } as FactLine] : []),
  ...(spec.flow ? [{ key: 'codex.fixtures.use.flow', names: { sides: sidesOf(spec.flow) } } as FactLine] : []),
  ...(spec.lineIn ? [{ key: 'codex.fixtures.use.lineIn', names: { sides: sidesOf(spec.lineIn) } } as FactLine] : []),
  ...(spec.lineOut ? [{ key: 'codex.fixtures.use.lineOut', names: { sides: sidesOf(spec.lineOut) } } as FactLine] : []),
  ...(spec.packSize ? [{ key: 'codex.fixtures.use.packSize', values: { size: spec.packSize } } as FactLine] : []),
  ...(spec.speed ? [{ key: 'codex.fixtures.use.speed', values: { value: percentOf(spec.speed) } } as FactLine] : []),
  ...(spec.yield ? [{ key: 'codex.fixtures.use.yield', values: { value: percentOf(spec.yield) } } as FactLine] : []),
  ...(spec.sales ? [{ key: 'codex.fixtures.use.sales', values: { value: percentOf(spec.sales) } } as FactLine] : []),
  ...(spec.quality ? [{ key: 'codex.fixtures.use.quality', values: { value: percentOf(spec.quality) } } as FactLine] : []),
];

export function figuresOf(spec: FixtureSpec): FixtureFigure[] {
  return FIGURES.flatMap(({ field, key, format }) => {
    const value = spec[field];
    return typeof value === 'number' && value > 0 ? [{ key, value: format(value) }] : [];
  });
}

// What a page says of its piece, drawn from the rules: interiors that give the same text are grouped together.
export function factsOf(page: FixturePage): FixtureFacts[] {
  const groups = new Map<string, FixtureFacts>();
  for (const id of page.fixtures) {
    const spec = FIXTURES[id];
    const description = [descriptionOf(spec)];
    const usage = usageOf(spec);
    const signature = JSON.stringify([description, usage]);
    const known = groups.get(signature);
    groups.set(signature, { interiors: [...(known?.interiors ?? []), spec.venue], description, usage });
  }
  return [...groups.values()];
}

export const interiorRowsOf = (page: FixturePage): FixtureInteriorRow[] => page.fixtures.map(id => ({ id, spec: FIXTURES[id], figures: figuresOf(FIXTURES[id]) }));
