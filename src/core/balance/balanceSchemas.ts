import { z } from 'zod';
import { STAFF_ROLES_ALL } from '../venues/venueVocabulary.ts';

const count = z.int().min(0);
const positive = z.number().positive();
const share = z.number().min(0).max(1);

const schemaField = { $schema: z.string().optional() };

// Slots a Workshop unlocks by buying them, and what the city, the market and the shops charge or pay.
export const economyBalanceSchema = z
  .strictObject({
    ...schemaField,
    tax: z.strictObject({ urbsPerCitizenPerHour: positive, capHours: positive }),
    market: z.strictObject({ fullPoints: positive, floorPoints: positive, pointsLostPerUnit: positive, recoveryMinutes: positive }),
    // Price of the Slot of each rank, by the number of Slots it brings the Workshop to.
    slotPrices: z.record(z.string().regex(/^\d+$/, 'must be a Slot count'), count),
    parcelPricing: z.strictObject({ base: positive, factor: positive, roundTo: z.int().min(1) }),
    shop: z.strictObject({ stackSize: z.int().min(1), saleIntervalMinutes: positive }),
  })
  .meta({ title: 'Economy balance', description: 'assets/defs/balance/economy.json: tax, market, Slot and Parcel prices, shops.' });

const wages = z.record(z.string(), count).refine(wage => STAFF_ROLES_ALL.every(role => wage[role] !== undefined), 'needs a wage for every Staff role');

// What the Staff of a Venue costs and yields, the rules shared by every Venue, and its events.
export const venuesBalanceSchema = z
  .strictObject({
    ...schemaField,
    staff: z.strictObject({
      dayHours: positive,
      dailyWage: wages,
      // Hiring costs this many days of wages, once.
      hireFeeDays: positive,
      managerYield: positive,
      frontBaseRate: share,
      frontRatePerHire: share,
      withoutSecurityRate: share,
    }),
    venue: z.strictObject({ reachRadius: z.int().min(1), playPrice: count, minPrice: count, maxPrice: count, priceTolerance: share, refundRatio: share }),
    events: z.strictObject({ durationMinutes: positive, cooldownMinutes: positive, cancelRefund: share, maxDelayHours: positive, minRank: z.int().min(1) }),
  })
  .meta({ title: 'Venues balance', description: 'assets/defs/balance/venues.json: Staff wages and yields, shared Venue constants, events.' });

// What building a road costs per tile, by road Tier.
export const trafficBalanceSchema = z
  .strictObject({ ...schemaField, roadTierCosts: z.array(count).min(1) })
  .meta({ title: 'Traffic balance', description: 'assets/defs/balance/traffic.json: the cost of a road tile by Tier.' });
