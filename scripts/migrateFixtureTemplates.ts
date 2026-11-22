import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { expandFixtureTemplate, type FixtureTemplate, type FixtureTemplateBody } from '../src/core/venues/fixtureExpansion.ts';
import { FIXTURE_EFFECTS, FIXTURE_TRAITS } from '../src/core/venues/venueVocabulary.ts';
import { writeCollection } from './collectionFiles.ts';
import { collectionDir, idOfFile, jsonFilesIn, readCollection, readOrder } from './collectionRead.ts';
import type { Definition } from './collections.ts';

// Throwaway: regroups every Fixture of the game, written one by one or unfolded from a template, into the fewest templates.
// A dry run reports and checks; --write rewrites assets/defs/fixtureTemplates and removes the files of the Fixtures it moved.

const MAX_OVERRIDDEN_FIELDS = 3;

const PLAIN = ['name', 'category', 'model', 'footprint', 'price', 'minTier', 'wear', 'role', 'family', 'ports'] as const;
const PLACEMENT = ['minRank', 'partition', 'passable', 'joins'] as const;
const VISUAL = ['tint', 'truck', 'smoke', 'hatch'] as const;
const FLAG_TRAITS: readonly string[] = ['heat', 'prep', 'reception', 'picks', 'loud', 'reverses'];
const SHAPE_KEYS = new Set<string>(['$schema', 'kind', 'venue', ...PLAIN, ...PLACEMENT, ...VISUAL, 'wall', 'wallPort', ...FIXTURE_EFFECTS, ...FIXTURE_TRAITS]);

const same = (a: unknown, b: unknown): boolean => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, sorted(item)]));
}

const pick = (definition: Definition, keys: readonly string[]): Record<string, unknown> => Object.fromEntries(keys.filter(key => key in definition).map(key => [key, definition[key]]));

const nonEmpty = <T extends object>(name: string, value: T): Record<string, T> => (Object.keys(value).length ? { [name]: value } : {});

// The fields that the flat shape holds and a template cannot say yet, which keep a Fixture in its own file.
export const unsayableFields = (definition: Definition): string[] => Object.keys(definition).filter(key => !SHAPE_KEYS.has(key));

export function bodyOf(definition: Definition): FixtureTemplateBody | undefined {
  if (unsayableFields(definition).length || ('wall' in definition && 'wallPort' in definition)) return undefined;
  const bonuses = FIXTURE_EFFECTS.filter(effect => effect in definition).map(effect => ({ effect, value: definition[effect] as number }));
  const traits = FIXTURE_TRAITS.filter(trait => trait in definition).map(trait => ({ trait, ...(FLAG_TRAITS.includes(trait) ? {} : { value: definition[trait] as string }) }));
  const onWall = definition.wall ? 'any' : definition.wallPort ? 'back' : undefined;
  return {
    ...pick(definition, PLAIN),
    ...(bonuses.length ? { bonuses } : {}),
    ...(traits.length ? { traits } : {}),
    ...nonEmpty('placement', { ...pick(definition, PLACEMENT), ...(onWall ? { onWall } : {}) }),
    ...nonEmpty('visual', pick(definition, VISUAL)),
  } as unknown as FixtureTemplateBody;
}

const baseOf = (venue: string, id: string): string | undefined => {
  const rest = id.slice(venue.length);
  return id.startsWith(venue) && /^[A-Z]/.test(rest) ? rest.charAt(0).toLowerCase() + rest.slice(1) : undefined;
};

interface Member {
  id: string;
  venue: string;
  body: FixtureTemplateBody;
}

const fieldsOf = (body: FixtureTemplateBody): Record<string, unknown> => ({ ...body });

const differences = (template: FixtureTemplateBody, body: FixtureTemplateBody): string[] | undefined => {
  const [before, after] = [fieldsOf(template), fieldsOf(body)];
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => !same(before[key], after[key]));
  return changed.some(key => !(key in after)) ? undefined : changed;
};

const mostCommon = (members: readonly Member[]): FixtureTemplateBody => {
  const tally = new Map<string, { body: FixtureTemplateBody; count: number }>();
  for (const { body } of members) {
    const key = JSON.stringify(sorted(body));
    tally.set(key, { body, count: (tally.get(key)?.count ?? 0) + 1 });
  }
  return [...tally.values()].sort((a, b) => b.count - a.count)[0]!.body;
};

export interface Plan {
  templates: Record<string, FixtureTemplate>;
  moved: string[];
  kept: Record<string, string[]>;
}

export function planTemplates(definitions: Record<string, Definition>): Plan {
  const templates: Record<string, FixtureTemplate> = {};
  const moved: string[] = [];
  const kept: Record<string, string[]> = {};
  const groups = new Map<string, Member[]>();
  const standalone: Member[] = [];
  for (const [id, definition] of Object.entries(definitions)) {
    const body = bodyOf(definition);
    if (!body) {
      for (const field of unsayableFields(definition)) (kept[field] ??= []).push(id);
      continue;
    }
    const venue = definition.venue as string;
    const base = baseOf(venue, id);
    if (base) groups.set(base, [...(groups.get(base) ?? []), { id, venue, body }]);
    else standalone.push({ id, venue, body });
  }
  const claim = (templateId: string, template: FixtureTemplate, ids: readonly string[]) => {
    if (templateId in templates) throw new Error(`two templates would be called ${templateId}`);
    templates[templateId] = { kind: 'fixtureTemplate', ...template } as FixtureTemplate;
    moved.push(...ids);
  };
  const freeId = (member: Member): string => (member.id in templates ? `${member.id}${member.venue.charAt(0).toUpperCase()}${member.venue.slice(1)}` : member.id);
  const alone = (member: Member) => claim(freeId(member), { venues: [member.venue], ids: { [member.venue]: member.id }, ...member.body } as FixtureTemplate, [member.id]);
  for (const [base, members] of groups) {
    const template = mostCommon(members);
    const overrides: Record<string, Partial<FixtureTemplateBody>> = {};
    const shared: Member[] = [];
    const apart: Member[] = [];
    for (const member of members) {
      const changed = differences(template, member.body);
      if (!changed || changed.length > MAX_OVERRIDDEN_FIELDS) apart.push(member);
      else {
        if (changed.length) overrides[member.venue] = Object.fromEntries(changed.map(key => [key, fieldsOf(member.body)[key]]));
        shared.push(member);
      }
    }
    claim(base, { venues: shared.map(member => member.venue), ...(Object.keys(overrides).length ? { overrides } : {}), ...template } as FixtureTemplate, shared.map(member => member.id));
    for (const member of apart) alone(member);
  }
  for (const member of standalone) alone(member);
  return { templates, moved, kept };
}

const withoutSchema = (definition: Definition): Definition => Object.fromEntries(Object.entries(definition).filter(([key]) => key !== '$schema'));

// What a template says is checked by unfolding it again: it must give back the Fixtures it replaces, field for field.
export function mismatches(plan: Plan, definitions: Record<string, Definition>): string[] {
  const seen = new Set<string>();
  return Object.entries(plan.templates).flatMap(([templateId, template]) =>
    expandFixtureTemplate(templateId, template).flatMap(({ id, definition }) => {
      seen.add(id);
      return same(definition, withoutSchema(definitions[id] ?? {})) ? [] : [id];
    }),
  ).concat(plan.moved.filter(id => !seen.has(id)));
}

export function allDefinitions(): Record<string, Definition> {
  const fixtures = readCollection('fixtures');
  const templates = readCollection('fixtureTemplates');
  const unfolded = Object.entries(templates).flatMap(([id, template]) => expandFixtureTemplate(id, template as unknown as FixtureTemplate).map(({ id: fixtureId, definition }): [string, Definition] => [fixtureId, definition]));
  const all = { ...fixtures, ...Object.fromEntries(unfolded) };
  const order = readOrder(collectionDir('fixtures'));
  return Object.fromEntries(order.filter(id => id in all).map(id => [id, all[id]!]));
}

function report(plan: Plan, definitions: Record<string, Definition>) {
  const total = Object.keys(definitions).length;
  const wrong = mismatches(plan, definitions);
  const shared = Object.values(plan.templates).filter(template => template.venues.length > 1).length;
  const overridden = Object.values(plan.templates).filter(template => template.overrides).length;
  console.log(`${total} Fixtures: ${plan.moved.length} move into ${Object.keys(plan.templates).length} templates (${shared} shared by several venues, ${overridden} with overrides), ${total - plan.moved.length} stay in their own file.`);
  for (const [field, ids] of Object.entries(plan.kept)) console.log(`  stays because of ${field}: ${ids.length}`);
  if (wrong.length) console.log(`MISMATCH after unfolding: ${wrong.join(', ')}`);
  return wrong.length === 0;
}

function write(plan: Plan) {
  const old = readCollection('fixtureTemplates');
  writeCollection('fixtureTemplates', plan.templates as unknown as Record<string, Definition>);
  const remaining = Object.fromEntries(Object.entries(readCollection('fixtures')).filter(([id]) => !plan.moved.includes(id)));
  writeCollection('fixtures', remaining);
  for (const id of Object.keys(old)) if (!(id in plan.templates) && jsonFilesIn(collectionDir('fixtureTemplates')).includes(`${id}.json`)) rmSync(join(collectionDir('fixtureTemplates'), `${id}.json`));
  console.log(`wrote ${Object.keys(plan.templates).length} templates; ${jsonFilesIn(collectionDir('fixtures')).map(idOfFile).length} Fixtures keep a file`);
}

if (process.argv[1]?.endsWith('migrateFixtureTemplates.ts')) {
  const definitions = allDefinitions();
  const plan = planTemplates(definitions);
  const ok = report(plan, definitions);
  if (process.argv.includes('--write')) {
    if (!ok) throw new Error('refusing to write: the templates do not unfold into the Fixtures they replace');
    write(plan);
  }
}
