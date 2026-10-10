import type { z } from 'zod';
import type { Reference } from './collections.ts';
import { economyBalanceSchema, trafficBalanceSchema, venuesBalanceSchema } from '../src/core/balance/balanceSchemas.ts';
import { bridgeInfrastructureSchema, railsInfrastructureSchema, roadsInfrastructureSchema, sceneryInfrastructureSchema } from '../src/core/infrastructure/infrastructureSchemas.ts';
import { natureDescriptionsSchema, NATURE_DESCRIPTION_VALUES } from '../src/core/descriptions/descriptionSchemas.ts';
import { templateProblems } from '../src/core/descriptions/descriptionProblems.ts';
import { packFormatsSchema } from '../src/core/economy/itemSchemas.ts';

// Game data held in one file rather than one file per id. Pure: shared by the scripts, the build and the editor.

export interface SingletonSpec {
  file: string;
  title: string;
  schemaName: string;
  schema: z.ZodType;
  // The Model ids it points to.
  references?: (value: never) => Reference[];
  // Checks the shape cannot express.
  problems?: (value: never) => { path: string; message: string }[];
}

const model = (id: string, path: string): Reference => ({ target: 'models', id, path });

export const SINGLETONS = {
  economy: { file: 'assets/defs/balance/economy.json', title: 'Economy balance', schemaName: 'balance-economy', schema: economyBalanceSchema },
  venues: { file: 'assets/defs/balance/venues.json', title: 'Venues balance', schemaName: 'balance-venues', schema: venuesBalanceSchema },
  traffic: { file: 'assets/defs/balance/traffic.json', title: 'Traffic balance', schemaName: 'balance-traffic', schema: trafficBalanceSchema },
  roads: {
    file: 'assets/defs/infrastructure/roads.json',
    title: 'Roads',
    schemaName: 'infrastructure-roads',
    schema: roadsInfrastructureSchema,
    references: ({ pieces }: { pieces: Record<string, string> }) => Object.entries(pieces).map(([piece, id]) => model(id, `pieces.${piece}`)),
  },
  rails: {
    file: 'assets/defs/infrastructure/rails.json',
    title: 'Rails',
    schemaName: 'infrastructure-rails',
    schema: railsInfrastructureSchema,
    references: ({ straight, corner }: { straight: string; corner: string }) => [model(straight, 'straight'), model(corner, 'corner')],
  },
  bridge: {
    file: 'assets/defs/infrastructure/bridge.json',
    title: 'Bridge',
    schemaName: 'infrastructure-bridge',
    schema: bridgeInfrastructureSchema,
    references: ({ road }: { road: string }) => [model(road, 'road')],
  },
  scenery: {
    file: 'assets/defs/infrastructure/scenery.json',
    title: 'Scenery',
    schemaName: 'infrastructure-scenery',
    schema: sceneryInfrastructureSchema,
    references: ({ parkTree, roofPanel, groundPanel, customers }: { parkTree: string; roofPanel: string; groundPanel: string; customers: string[] }) => [
      model(parkTree, 'parkTree'),
      model(roofPanel, 'roofPanel'),
      model(groundPanel, 'groundPanel'),
      ...customers.map((id, index) => model(id, `customers.${index}`)),
    ],
  },
  natureDescriptions: {
    file: 'assets/defs/descriptions/nature.json',
    title: 'Nature descriptions',
    schemaName: 'descriptions-nature',
    schema: natureDescriptionsSchema,
    problems: ({ families }: { families: Record<string, { en: string; fr: string }> }) =>
      Object.entries(families).flatMap(([family, text]) => (['en', 'fr'] as const).flatMap(language => templateProblems(text[language], new Set(NATURE_DESCRIPTION_VALUES), `families.${family}.${language}`))),
  },
  packFormats: { file: 'assets/defs/packFormats.json', title: 'Pack formats', schemaName: 'packFormats', schema: packFormatsSchema },
} satisfies Record<string, SingletonSpec>;

export type SingletonName = keyof typeof SINGLETONS;

export const SINGLETON_NAMES = Object.keys(SINGLETONS) as SingletonName[];

export type Singletons = Record<SingletonName, Record<string, unknown>>;

export const singletonSpecOf = (name: SingletonName): SingletonSpec => SINGLETONS[name];
