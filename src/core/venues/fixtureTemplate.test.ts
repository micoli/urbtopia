import { describe, expect, it } from 'vitest';
import { expandFixtureTemplate, fixtureIdOf, type FixtureTemplate } from './fixtureExpansion';
import { fixtureSchema } from './fixtureSchema';
import { fixtureTemplateSchema } from './fixtureTemplate';

const pipeElbowFields = {
  name: { en: 'Water pipe elbow', fr: "Tuyau d'eau coudé" },
  category: 'line',
  model: 'engine-room-water-pipe-elbow',
  footprint: [1, 1],
  price: 25,
  minTier: 1,
  wear: 0.03,
  role: 'circuit',
  family: 'link',
  ports: [
    { side: 'front', medium: 'water', direction: 'both' },
    { side: 'right', medium: 'water', direction: 'both' },
  ],
};

const pipeElbow = {
  name: { en: 'Water pipe elbow', fr: "Tuyau d'eau coudé" },
  category: 'line',
  model: 'engine-room-water-pipe-elbow',
  footprint: [1, 1],
  price: 25,
  minTier: 1,
  wear: 0.03,
  role: 'circuit',
  family: 'link',
  ports: [
    { side: 'front', medium: 'water', direction: 'both' },
    { side: 'right', medium: 'water', direction: 'both' },
  ],
} as const;

const shared = (template: Partial<FixtureTemplate> = {}): FixtureTemplate => ({ ...pipeElbow, venues: ['coalPlant', 'hydroPlant'], ...template }) as FixtureTemplate;

describe('fixtureIdOf', () => {
  it('puts the id of the template after the name of the venue', () => {
    expect(fixtureIdOf('coalPlant', 'waterPipeElbow')).toBe('coalPlantWaterPipeElbow');
  });
});

describe('expanding a template', () => {
  it('gives every venue the Fixture that its own file used to hold', () => {
    const expanded = expandFixtureTemplate('waterPipeElbow', shared());
    expect(expanded.map(({ id }) => id)).toEqual(['coalPlantWaterPipeElbow', 'hydroPlantWaterPipeElbow']);
    for (const { id, definition } of expanded) expect(definition).toEqual({ kind: 'fixture', venue: id.replace('WaterPipeElbow', ''), ...pipeElbowFields });
  });

  it('writes the bonuses and the traits as the flat fields the venues read', () => {
    const [airHockey] = expandFixtureTemplate('airHockey', {
      name: { en: 'Air hockey table', fr: 'Table d’air hockey' },
      category: 'games',
      model: 'mini-arcade-air-hockey',
      footprint: [1, 1],
      price: 220,
      minTier: 1,
      venues: ['arcade'],
      ids: { arcade: 'airHockey' },
      bonuses: [{ effect: 'playsPerHour', value: 4 }],
      traits: [{ trait: 'loud' }],
    });
    expect(airHockey).toEqual({
      id: 'airHockey',
      definition: { kind: 'fixture', venue: 'arcade', category: 'games', name: { en: 'Air hockey table', fr: 'Table d’air hockey' }, model: 'mini-arcade-air-hockey', footprint: [1, 1], price: 220, minTier: 1, loud: true, playsPerHour: 4 },
    });
  });

  it('writes the placement, the visual and the ports of an engine room machine', () => {
    const [boiler] = expandFixtureTemplate('steamBoiler', {
      ...pipeElbow,
      name: { en: 'Steam boiler', fr: 'Chaudière à vapeur' },
      category: 'machines',
      model: 'engine-room-steam-boiler',
      price: 1500,
      wear: 0.1,
      family: 'steamBoiler',
      venues: ['coalPlant'],
      visual: { smoke: [0, 1.3, 0.3] },
      ports: [
        { side: 'back', medium: 'coal', direction: 'in' },
        { side: 'left', medium: 'water', direction: 'in' },
        { side: 'right', medium: 'steam', direction: 'out' },
        { side: 'front', medium: 'smoke', direction: 'out' },
      ],
    });
    expect(boiler!.definition).toEqual({
      kind: 'fixture',
      venue: 'coalPlant',
      category: 'machines',
      name: { en: 'Steam boiler', fr: 'Chaudière à vapeur' },
      model: 'engine-room-steam-boiler',
      footprint: [1, 1],
      price: 1500,
      minTier: 1,
      wear: 0.1,
      role: 'circuit',
      family: 'steamBoiler',
      smoke: [0, 1.3, 0.3],
      ports: [
        { side: 'back', medium: 'coal', direction: 'in' },
        { side: 'left', medium: 'water', direction: 'in' },
        { side: 'right', medium: 'steam', direction: 'out' },
        { side: 'front', medium: 'smoke', direction: 'out' },
      ],
    });
  });

  it('turns onWall into the wall rules: any hangs on a wall, back stands against the back wall', () => {
    const [hung] = expandFixtureTemplate('painting', shared({ venues: ['home'], placement: { onWall: 'any' } }));
    const [backed] = expandFixtureTemplate('port', shared({ venues: ['coalPlant'], placement: { onWall: 'back' } }));
    expect(hung!.definition).toMatchObject({ wall: true });
    expect(hung!.definition).not.toHaveProperty('wallPort');
    expect(backed!.definition).toMatchObject({ wallPort: true });
    expect(backed!.definition).not.toHaveProperty('wall');
  });

  it('lets a venue replace what the template says, and name its own id', () => {
    const expanded = expandFixtureTemplate('waterPipeElbow', shared({ overrides: { hydroPlant: { price: 30 } }, ids: { coalPlant: 'steamLine' } }));
    expect(expanded.map(({ id }) => id)).toEqual(['steamLine', 'hydroPlantWaterPipeElbow']);
    expect(expanded.map(({ definition }) => definition.price)).toEqual([25, 30]);
  });
});

describe('the schema of a template', () => {
  const template = { kind: 'fixtureTemplate', ...pipeElbow, venues: ['coalPlant', 'hydroPlant'] };

  it('accepts a template that every venue can read', () => {
    expect(fixtureTemplateSchema.safeParse(template).success).toBe(true);
  });

  it('reports a venue that does not know a field of the template', () => {
    const result = fixtureTemplateSchema.safeParse({ ...template, venues: ['coalPlant', 'arcade'] });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('in arcade');
  });

  it('reports a venue listed twice, and an id or an override for a venue that is not listed', () => {
    const messages = (value: unknown) => fixtureTemplateSchema.safeParse(value).error?.issues.map(({ message }) => message);
    expect(messages({ ...template, venues: ['coalPlant', 'coalPlant'] })).toContain('coalPlant is listed twice');
    expect(messages({ ...template, ids: { farm: 'farmPipe' } })).toContain('farm has an id or an override but is not in venues');
  });

  it('expands to Fixtures that the schema of the Fixtures accepts', () => {
    for (const { definition } of expandFixtureTemplate('waterPipeElbow', shared())) expect(fixtureSchema.safeParse(definition).success).toBe(true);
  });
});
