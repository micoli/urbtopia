import { z } from 'zod';
import { localizedText } from '../economy/itemSchemas.ts';

const month = z.int().min(1).max(12);
const dayOfMonth = z.int().min(1).max(31);

// The date an Annual event is anchored on, each year.
const anchorSchema = z.discriminatedUnion('kind', [
  // The same day every year.
  z.strictObject({ kind: z.literal('fixed'), month, day: dayOfMonth }),
  // The Western Easter Sunday.
  z.strictObject({ kind: z.literal('easter') }),
  // The first given weekday (0 is Sunday) from a day to a day of a month, both included.
  z.strictObject({ kind: z.literal('weekdayInRange'), weekday: z.int().min(0).max(6), month, from: dayOfMonth, to: dayOfMonth }),
]);

export const annualEventSchema = z
  .strictObject({ $schema: z.string().optional(), name: localizedText, anchor: anchorSchema })
  .meta({ title: 'Annual event', description: 'An Annual event of the calendar, one file per event id in assets/defs/annualEvents.' });

export type AnnualEventDefinition = z.infer<typeof annualEventSchema>;
export type AnnualEventAnchor = AnnualEventDefinition['anchor'];
