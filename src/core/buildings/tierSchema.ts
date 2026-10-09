import { z } from 'zod';

const count = z.int().min(0);

export const pairSchema = z.tuple([z.int().min(1), z.int().min(1)]);

export const upgradeCostSchema = z.strictObject({ urbs: count, goods: z.record(z.string(), z.int().min(1)).optional() });

// Tiers in order: each leaves out what it keeps from the previous one, except its upgrade cost. Tier 1 sets every required field and costs nothing to reach.
export function tiersOf<Shape extends z.ZodRawShape>(shape: Shape, required: readonly (keyof Shape & string)[]) {
  return z
    .array(z.strictObject(shape).partial().extend({ upgradeCost: upgradeCostSchema.optional() }))
    .min(1)
    .superRefine((tiers, context) => {
      const first = tiers[0] as Record<string, unknown> | undefined;
      for (const key of required) if (first?.[key] === undefined) context.addIssue({ code: 'custom', path: [0, key], message: 'Tier 1 must set it' });
      if (first?.upgradeCost) context.addIssue({ code: 'custom', path: [0, 'upgradeCost'], message: 'Tier 1 has no upgrade cost' });
      tiers.forEach((tier, index) => index > 0 && !(tier as Record<string, unknown>).upgradeCost && context.addIssue({ code: 'custom', path: [index, 'upgradeCost'], message: 'required from Tier 2' }));
    });
}

// Named visual overrides of the first Tiers (a Solar Home): Tiers beyond the variant's keep the base look.
export const variantsOf = <Shape extends z.ZodRawShape>(shape: Shape) =>
  z.record(z.string().regex(/^[a-z][A-Za-z0-9]*$/, 'must be camelCase'), z.strictObject({ tiers: z.array(z.strictObject(shape).partial()).min(1) }));
