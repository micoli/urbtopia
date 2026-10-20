import { z } from 'zod';
import { SANCTIONABLE_FACTOR_IDS } from '../environment/needFactors.ts';
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
    office: z.strictObject({ urbsPerJobPerHour: positive, capHours: positive }),
    market: z.strictObject({ fullPoints: positive, floorPoints: positive, pointsLostPerUnit: positive, recoveryMinutes: positive }),
    // Price of the Slot of each rank, by the number of Slots it brings the Workshop to.
    slotPrices: z.record(z.string().regex(/^\d+$/, 'must be a Slot count'), count),
    // The Rush price is priceFactor × the value of the running production × the share of time left, never below minPrice.
    rush: z.strictObject({ priceFactor: positive, minPrice: count }),
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

const DIFFICULTY_IDS = ['cozy', 'easy', 'medium', 'hard'] as const;

const difficultyRule = z.strictObject({
  // The Need factors that lower the Tax of a Home under this Difficulty.
  factors: z.array(z.enum(SANCTIONABLE_FACTOR_IDS)).refine(factors => new Set(factors).size === factors.length, 'lists a factor twice'),
  // The share of its Tax a sanctioned Home keeps at worst.
  taxFloor: z.number().gt(0).max(1),
  // Reserved for the day a Sanction takes Citizens away; 0 means none leave.
  citizenLossSeverity: z.number().min(0).max(1),
});

// What each Difficulty sanctions. Each Difficulty sanctions everything the one before it does, and Cozy nothing.
export const sanctionsBalanceSchema = z
  .strictObject({ ...schemaField, difficulties: z.strictObject(Object.fromEntries(DIFFICULTY_IDS.map(id => [id, difficultyRule])) as Record<(typeof DIFFICULTY_IDS)[number], typeof difficultyRule>) })
  .refine(({ difficulties }) => difficulties.cozy.factors.length === 0, { path: ['difficulties', 'cozy', 'factors'], message: 'Cozy sanctions nothing' })
  .refine(({ difficulties }) => DIFFICULTY_IDS.every((id, index) => {
    const previous = DIFFICULTY_IDS[index - 1];
    return previous === undefined || difficulties[previous].factors.every(factor => difficulties[id].factors.includes(factor));
  }), { path: ['difficulties'], message: 'each Difficulty must sanction at least what the one before it does' })
  .meta({ title: 'Sanctions balance', description: 'assets/defs/balance/sanctions.json: what each Difficulty sanctions, and how hard.' });

// How much Waste Citizens produce and how far a Pedestrian way carries it; the facilities themselves are building definitions.
export const wasteBalanceSchema = z
  .strictObject({
    ...schemaField,
    unitsPerCitizenPerDay: positive,
    dayHours: positive,
    // Longest walk along the Pedestrian path network from a Home to a Road a facility is linked to.
    carryingDistance: z.int().min(1),
    // Multiplier on the tariff for a Home served through the Carrying distance.
    carriedSurcharge: z.number().min(1),
    // A saved city with more Citizens than this gets an Adaptation period when Waste arrives.
    adaptationCitizens: count,
  })
  .meta({ title: 'Waste balance', description: 'assets/defs/balance/waste.json: Waste production, Carrying distance.' });

const politicsDifficultyRule = z.strictObject({
  // Whether the Council, the Approval, the Objectives and the Petitions exist.
  active: z.boolean(),
  // Whether Petitions weigh on the Approval: handling one raises it, and an ignored one escalates into a Demonstration.
  demonstrations: z.boolean(),
  // Whether a Term ends with an Election.
  election: z.boolean(),
  // Whether the Approval modulates the amount of a Grant.
  approvalWeighsOnGrants: z.boolean(),
  // Whether the Approval sets the goodwill of the Council.
  approvalWeighsOnCouncil: z.boolean(),
});

// Mayor, Council, Approval, Objectives and Grants: the Ordinances and the Objectives themselves are Game objects.
export const politicsBalanceSchema = z
  .strictObject({
    ...schemaField,
    dayHours: positive,
    term: z.strictObject({ days: z.int().min(1) }),
    // Days after the first activation during which no Demonstration and no Approval penalty applies.
    adaptationDays: count,
    council: z.strictObject({
      seats: z.strictObject({ economy: z.int().min(1), environment: z.int().min(1), services: z.int().min(1) }),
      // Days before a rejected Ordinance can be proposed again.
      reproposeDelayDays: z.int().min(1),
    }),
    approval: z.strictObject({
      initial: z.number().min(0).max(100),
      // Share of the gap to the target the Approval closes each day.
      dailyConvergence: share,
      // Share of a shock that fades each day.
      shockFadePerDay: share,
      // Points of Approval, positive or negative, added by one-off events.
      shocks: z.strictObject({ ordinanceAdopted: z.number(), popularOrdinanceRepealed: z.number(), petitionHandled: z.number(), demonstration: z.number() }),
    }),
    petitions: z.strictObject({
      // A Home complains about a Need factor whose satisfaction (0-100) is below this.
      belowSatisfaction: z.number().min(0).max(100),
      // Chance, each game day, that a district with a cause for complaint files a Petition.
      chancePerDay: share,
      maxOpen: z.int().min(1),
      // Game days after which an unhandled Petition escalates into a Demonstration.
      escalationDays: z.int().min(1),
      // A district whose Homes all have a satisfaction (0-100) above this can earn Support.
      supportAbove: z.number().min(0).max(100),
      supportChancePerDay: share,
      maxSupport: z.int().min(1),
      // Game days a Support message lasts.
      supportDays: z.int().min(1),
    }),
    objectives: z.strictObject({
      activeCount: z.int().min(1),
      // On Hard a Grant is multiplied by a factor that goes from the first value at an Approval of 0 to the second at 100.
      grantScale: z.strictObject({ atZeroApproval: positive, atFullApproval: positive }),
    }).refine(({ grantScale }) => grantScale.atFullApproval >= grantScale.atZeroApproval, { path: ['grantScale'], message: 'a higher Approval cannot lower a Grant' }),
    difficulties: z.strictObject(Object.fromEntries(DIFFICULTY_IDS.map(id => [id, politicsDifficultyRule])) as Record<(typeof DIFFICULTY_IDS)[number], typeof politicsDifficultyRule>),
  })
  .refine(({ difficulties }) => !difficulties.cozy.active, { path: ['difficulties', 'cozy', 'active'], message: 'Cozy has no politics' })
  .refine(({ difficulties }) => DIFFICULTY_IDS.every((id, index) => {
    const previous = DIFFICULTY_IDS[index - 1];
    if (previous === undefined) return true;
    return (Object.keys(difficulties[id]) as (keyof typeof difficulties.cozy)[]).every(key => difficulties[id][key] || !difficulties[previous][key]);
  }), { path: ['difficulties'], message: 'each Difficulty must keep everything the one before it has' })
  .meta({ title: 'Politics balance', description: 'assets/defs/balance/politics.json: Term, Council seats, Approval, Objectives, and what each Difficulty enables.' });
