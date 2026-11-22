import { FIXTURES, driveSidesOf, flowSidesOf, lineInSidesOf, lineOutSidesOf, type FixtureId, type FixtureSpec } from '../core';
import type { FixtureEffect } from '../core/venues/venueVocabulary';
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

interface Figure {
  key: MessageKey;
  format: (value: number) => string;
}

const figure = (name: string, format: Figure['format']): Figure => ({ key: `codex.fixtures.figure.${name}` as MessageKey, format });

// How the Codex shows each effect of a Fixture, in the order of the page; null for an effect that it does not show. A new effect has to be given its place here.
const FIGURES = {
  attract: figure('attract', percentOf),
  quality: figure('quality', percentOf),
  capacity: figure('capacity', percentOf),
  speed: figure('speed', percentOf),
  yield: figure('yield', percentOf),
  sales: figure('sales', percentOf),
  coolant: figure('coolant', percentOf),
  wear: figure('wear', percentOf),
  comfort: figure('comfort', String),
  playsPerHour: figure('playsPerHour', String),
  shelf: figure('shelf', String),
  checkout: figure('checkout', String),
  cook: figure('cook', String),
  seats: figure('seats', String),
  drinks: figure('drinks', String),
  stools: figure('stools', String),
  waiting: figure('waiting', String),
  sleeps: figure('sleeps', String),
  bath: figure('bath', String),
  strength: null,
  draw: null,
  power: null,
  generation: null,
  cleaner: null,
} satisfies Record<FixtureEffect | 'wear', Figure | null>;

const HOME_ROLES: readonly string[] = ['bed', 'table', 'chair', 'stove', 'sink', 'washer', 'toilet'];

const descriptionOf = (spec: FixtureSpec): FactLine => {
  if (spec.partition) return { key: 'codex.fixtures.about.partition' };
  if (spec.role && HOME_ROLES.includes(spec.role)) return { key: 'codex.fixtures.about.home' };
  if (spec.role === 'leisure' || spec.role === 'decor') return { key: 'codex.fixtures.about.homeLeisure' };
  if (spec.role) return { key: `codex.fixtures.about.role.${spec.role}` as MessageKey };
  return { key: `codex.fixtures.about.category.${spec.category}` as MessageKey };
};

const sidesOf = (sides: readonly string[]): readonly MessageKey[] => sides.map(side => `codex.fixtures.side.${side}` as MessageKey);

const sidesLine = (use: 'drive' | 'flow' | 'lineIn' | 'lineOut', sides: readonly string[]): FactLine[] => (sides.length ? [{ key: `codex.fixtures.use.${use}` as MessageKey, names: { sides: sidesOf(sides) } }] : []);

const usageOf = (spec: FixtureSpec): FactLine[] => [
  { key: 'codex.fixtures.use.place', names: { category: [`venue.category.${spec.category}`] } },
  ...(spec.wall ? [{ key: 'codex.fixtures.use.wall' } as FactLine] : []),
  ...(spec.picks ? [{ key: 'codex.fixtures.use.picks' } as FactLine] : []),
  ...(spec.assigns ? [{ key: 'codex.fixtures.use.assigns', names: { role: [`interior.role.${spec.assigns}` as MessageKey] } } as FactLine] : []),
  ...sidesLine('drive', driveSidesOf(spec)),
  ...(spec.turns ? [{ key: `codex.fixtures.use.turns.${spec.turns}` } as FactLine] : []),
  ...sidesLine('flow', flowSidesOf(spec)),
  ...sidesLine('lineIn', lineInSidesOf(spec)),
  ...sidesLine('lineOut', lineOutSidesOf(spec)),
  ...(spec.packSize ? [{ key: 'codex.fixtures.use.packSize', values: { size: spec.packSize } } as FactLine] : []),
  ...(spec.speed ? [{ key: 'codex.fixtures.use.speed', values: { value: percentOf(spec.speed) } } as FactLine] : []),
  ...(spec.yield ? [{ key: 'codex.fixtures.use.yield', values: { value: percentOf(spec.yield) } } as FactLine] : []),
  ...(spec.sales ? [{ key: 'codex.fixtures.use.sales', values: { value: percentOf(spec.sales) } } as FactLine] : []),
  ...(spec.quality ? [{ key: 'codex.fixtures.use.quality', values: { value: percentOf(spec.quality) } } as FactLine] : []),
];

export function figuresOf(spec: FixtureSpec): FixtureFigure[] {
  return Object.entries(FIGURES).flatMap(([field, shown]) => {
    const value = spec[field as keyof FixtureSpec];
    return shown && typeof value === 'number' && value > 0 ? [{ key: shown.key, value: shown.format(value) }] : [];
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
