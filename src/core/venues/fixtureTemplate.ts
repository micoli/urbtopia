import { z } from 'zod';
import { pairSchema } from '../buildings/tierSchema.ts';
import { count, filled, localizedText } from '../economy/itemSchemas.ts';
import { expandFixtureTemplate, type FixtureTemplate } from './fixtureExpansion.ts';
import { fixtureSchema } from './fixtureSchema.ts';
import { FACTORY_FIXTURE_ROLES, FIXTURE_CATEGORIES_ALL, FIXTURE_EFFECTS, FIXTURE_MEDIA, FIXTURE_SIDES, FIXTURE_TRAITS, FIXTURE_VENUES, HOME_FIXTURE_ROLES, PORT_DIRECTIONS } from './venueVocabulary.ts';

const venue = z.enum(FIXTURE_VENUES);

const placement = z.strictObject({
  // Rank the Venue must have reached; 1 when left out.
  minRank: z.int().min(1).optional(),
  // A wall only divides the room: it earns, serves and wears nothing.
  partition: z.literal(true).optional(),
  // A wall with a doorway: people walk through it, across the wall.
  passable: z.literal(true).optional(),
  // The Fixture hangs on a wall segment (any) or only stands against the back wall of the room, facing it (back).
  onWall: z.enum(['any', 'back']).optional(),
  // The pieces a wall turns into where it meets other walls.
  joins: z.strictObject({ elbow: filled, tee: filled, cross: filled }).optional(),
});

const visual = z.strictObject({
  tint: z.string().regex(/^#[0-9a-f]{6}$/i, 'must be #rrggbb').optional(),
  truck: filled.optional(),
  smoke: z.tuple([z.number(), z.number(), z.number()]).optional(),
  hatch: z.number().positive().optional(),
});

const body = {
  name: localizedText,
  category: z.enum(FIXTURE_CATEGORIES_ALL),
  model: filled,
  footprint: pairSchema,
  price: count,
  minTier: z.int().min(1),
  wear: z.number().min(0).optional(),
  role: z.enum([...FACTORY_FIXTURE_ROLES, ...HOME_FIXTURE_ROLES]).optional(),
  family: z.string().min(1).optional(),
  ports: z.array(z.strictObject({ side: z.enum(FIXTURE_SIDES), medium: z.enum(FIXTURE_MEDIA), direction: z.enum(PORT_DIRECTIONS), optional: z.literal(true).optional() })).min(1).optional(),
  bonuses: z.array(z.strictObject({ effect: z.enum(FIXTURE_EFFECTS), value: z.number().min(0) })).min(1).optional(),
  traits: z.array(z.strictObject({ trait: z.enum(FIXTURE_TRAITS), value: filled.optional() })).min(1).optional(),
  placement: placement.optional(),
  visual: visual.optional(),
};

const override = z.strictObject(Object.fromEntries(Object.entries(body).map(([key, schema]) => [key, schema.optional()])));

const shape = {
  $schema: z.string().optional(),
  kind: z.literal('fixtureTemplate'),
  // The Fixture exists once for every venue listed: its id there is the venue and the id of the file, unless `ids` says otherwise.
  venues: z.array(venue).min(1),
  ids: z.partialRecord(venue, filled).optional(),
  // What differs in one venue: each field given replaces the field of the template.
  overrides: z.partialRecord(venue, override).optional(),
  ...body,
};

const base = z.strictObject(shape);

// The checks across fields run on a template whose fields are valid one by one.
export const fixtureTemplateSchema = base
  .superRefine((template, context) => {
    if (!base.safeParse(template).success) return;
    const duplicated = template.venues.filter((name, index) => template.venues.indexOf(name) !== index);
    for (const name of duplicated) context.addIssue({ code: 'custom', path: ['venues'], message: `${name} is listed twice` });
    for (const name of [...Object.keys(template.ids ?? {}), ...Object.keys(template.overrides ?? {})]) {
      if (!template.venues.includes(name as never)) context.addIssue({ code: 'custom', path: ['venues'], message: `${name} has an id or an override but is not in venues` });
    }
    for (const { definition } of expandFixtureTemplate('template', template as FixtureTemplate)) {
      const result = fixtureSchema.safeParse(definition);
      if (result.success) continue;
      for (const issue of result.error.issues) context.addIssue({ code: 'custom', path: [], message: `in ${String(definition.venue)}: ${issue.path.join('.')}: ${issue.message}` });
    }
  })
  .meta({ title: 'Fixture template', description: 'A Fixture shared by several venues, one file in assets/defs/fixtureTemplates; the game unfolds it into one Fixture per venue.' });

export type FixtureTemplateDefinition = z.infer<typeof fixtureTemplateSchema>;
