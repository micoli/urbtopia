import type { z } from 'zod';
import { packFormatsSchema } from '../src/core/economy/itemSchemas.ts';

// Game data held in one file rather than one file per id. Pure: shared by the scripts, the build and the editor.

export interface SingletonSpec {
  file: string;
  title: string;
  schemaName: string;
  schema: z.ZodType;
}

export const SINGLETONS = {
  packFormats: { file: 'assets/defs/packFormats.json', title: 'Pack formats', schemaName: 'packFormats', schema: packFormatsSchema },
} satisfies Record<string, SingletonSpec>;

export type SingletonName = keyof typeof SINGLETONS;

export const SINGLETON_NAMES = Object.keys(SINGLETONS) as SingletonName[];

export type Singletons = Record<SingletonName, Record<string, unknown>>;

export const singletonSpecOf = (name: SingletonName): SingletonSpec => SINGLETONS[name];
