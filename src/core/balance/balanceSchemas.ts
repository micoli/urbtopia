import { z } from 'zod';
import { SANCTIONABLE_FACTOR_IDS } from '../environment/needFactors.ts';
import { INTERIOR_FAMILIES_ALL, INTERIOR_PARTS_ALL, INTERIOR_ROLES_ALL, STAFF_ROLES_ALL } from '../venues/venueVocabulary.ts';

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

const wages = z.record(z.string(), count).refine(wage => [...STAFF_ROLES_ALL, ...INTERIOR_ROLES_ALL].every(role => wage[role] !== undefined), 'needs a wage for every Staff role and every interior role');

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

// How big the interior of a Factory is by Tier, and the most speed and yield its Machines can add.
export const factoryInteriorBalanceSchema = z
  .strictObject({
    ...schemaField,
    gridSizes: z.array(z.int().min(1)).min(1),
    speedCaps: z.array(positive).min(1),
    yieldCaps: z.array(positive).min(1),
    // Uses per hour of a Fixture that runs, which the wear is counted on, and the Technician posts by Tier.
    usagePerHour: positive,
    technicianPosts: z.array(count).min(1),
    // The power of a Motor, the share of it a Motor draws with nothing to drive, and how many active Machines a Motor can drive at full speed.
    motorPower: positive,
    idlePowerShare: positive,
    motorCapacity: positive,
    // The yield a Machine of one more kind adds to the floor, and what a cooling loop makes of the yield a coolant gives.
    varietyYield: positive,
    coolingLoopFactor: positive,
    // The share of its cap at which a bonus stops counting in full and starts to flatten.
    bonusKnee: z.number().gt(0).lt(1),
    // How many Cooling vats one Tank can feed.
    tankCoolingVats: z.int().min(1),
    // The share of the Motors' power that each Boiler that runs saves, and the most a floor can save.
    boilerPowerSaving: positive,
    maxPowerSaving: positive,
  })
  .meta({ title: 'Factory interior balance', description: 'assets/defs/balance/factoryInterior.json: the size of the Factory interior and the cap of the bonus its linked Machines add, by Factory Tier.' });

// Which buildings have an interior of the Production or Service families, and the Staff roles they hire: each role fills posts by Tier and carries one part of the effect.
export const interiorsBalanceSchema = z
  .strictObject({
    ...schemaField,
    buildings: z.record(
      z.string().min(1),
      z.strictObject({
        family: z.enum(INTERIOR_FAMILIES_ALL),
        // The Citizens a city needs before the interior can be fitted out.
        unlockCitizens: count.optional(),
        // Service interiors: the size of the room and the most quality the furniture can add, by Tier.
        service: z.strictObject({ gridSizes: z.array(z.int().min(1)).min(1), qualityCaps: z.array(positive).min(1) }).optional(),
        // Hospital: the Well-being points that a Home it serves can gain, and the weight of each role in them.
        care: z.strictObject({ points: positive, weights: z.strictObject({ carePrimary: share, careDoctor: share, careSurgeon: share }) }).optional(),
        // Production interiors: the size of the room, the caps of the bonus its linked Machines add and the Technician posts, by Tier. A building with a Line also has the caps of what its Exits add to the sales over its Counter and to what it holds. The Dairy splits its yield into groups of Goods, each delivered by its own role. The Factory and the Packhouse keep theirs in their own files.
        layout: z.strictObject({ gridSizes: z.array(z.int().min(1)).min(1), speedCaps: z.array(positive).min(1), yieldCaps: z.array(positive).min(1), technicianPosts: z.array(count).min(1), line: z.literal(true).optional(), salesCaps: z.array(positive).min(1).optional(), capacityCaps: z.array(positive).min(1).optional(), yieldGroups: z.record(z.string().min(1), z.array(z.string().min(1)).min(1)).optional() }).optional(),
        roles: z.partialRecord(z.enum(INTERIOR_ROLES_ALL), z.strictObject({ part: z.enum(INTERIOR_PARTS_ALL), posts: z.array(count).min(1) })),
      }),
    ),
  })
  .meta({ title: 'Interiors balance', description: 'assets/defs/balance/interiors.json: the Production and Service interiors, their Staff roles, the posts by Tier and the part of the effect each role carries.' });

// How big the interior of a Packhouse is by Tier, the most speed and yield its Line can add, and what its Strappers, Scanners and Exits do.
export const packhouseInteriorBalanceSchema = z
  .strictObject({
    ...schemaField,
    gridSizes: z.array(z.int().min(1)).min(1),
    speedCaps: z.array(positive).min(1),
    yieldCaps: z.array(positive).min(1),
    // Uses per hour of a Fixture that runs, which the wear is counted on, and the Technician posts by Tier.
    usagePerHour: positive,
    technicianPosts: z.array(count).min(1),
    restockerPosts: z.array(count).min(1),
    // The share of its cap at which a bonus stops counting in full and starts to flatten.
    bonusKnee: z.number().gt(0).lt(1),
    // How many Exits of each size a floor can have, by Tier.
    exitLimits: z.array(z.int().min(1)).min(1),
    // The yield each Strapper beyond the first on the floor adds.
    strapperSeriesYield: positive,
    // The share of the wear that remains downstream of a Scanner.
    scannerWearFactor: z.number().gt(0).lt(1),
  })
  .meta({ title: 'Packhouse interior balance', description: 'assets/defs/balance/packhouseInterior.json: the size of the Packhouse interior, the cap of the bonus its Line adds by Packhouse Tier, its Exits, Strappers and Scanners.' });

// How big the interior of a Home is by Tier, how its Comfort is weighed, and the most Well-being it can add by Tier.
export const homeInteriorBalanceSchema = z
  .strictObject({
    ...schemaField,
    gridSizes: z.array(z.int().min(1)).min(1),
    wellbeingCaps: z.array(positive).min(1),
    weights: z.strictObject({ sleeping: positive, washing: positive, eating: positive, cooking: positive, leisure: positive, decor: positive }),
    // The floors a Home interior can have, the first being the one it starts with; each is the model furniture-floorparquet<name>.
    parquets: z.array(z.string().min(1)).min(1),
    // The Citizens a city needs before its Homes can be furnished.
    unlockCitizens: count,
    // The largest distance, in tiles, between a table and the chair that serves it.
    chairReach: z.int().min(1),
    // The decor that covers half of the decor group; each further piece adds a smaller share.
    decorHalf: positive,
    refundRatio: share,
  })
  .meta({ title: 'Home interior balance', description: 'assets/defs/balance/homeInterior.json: the size of a Home interior by Tier, the weights of the groups of its Comfort and the Well-being it adds at most.' });

// What building a road costs per tile, and how fast a car drives on it, by road Tier.
export const trafficBalanceSchema = z
  .strictObject({
    ...schemaField,
    roadTierCosts: z.array(count).min(1),
    roadSpeeds: z.array(positive).min(1),
    // The Well-being a Home loses to its Unemployed Citizens: none up to the tolerance (a share of its Citizens), then linear to the cap.
    unemployment: z.strictObject({ tolerance: share, maxPenalty: positive }),
  })
  .meta({ title: 'Traffic balance', description: 'assets/defs/balance/traffic.json: the cost of a road tile and the free-flow speed of a car, in tiles per minute, by Tier, and the Well-being lost to Unemployed Citizens.' });

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

// What Schooling and Libraries add to the Knowledge of a Home, and what the city's Knowledge gives back.
export const knowledgeBalanceSchema = z
  .strictObject({
    ...schemaField,
    // Points of Knowledge of each School degree covering a Home, counted once.
    schooling: z.strictObject({ school: count, middleSchool: count, highSchool: count, university: count }),
    // Points of Knowledge by Library Tier, the best covering Library counting.
    library: z.array(count).min(1),
    // The effect reaches 1 - (1 - Knowledge / 100) ^ curveExponent of its maximum: concave, 70% at Knowledge 50.
    curveExponent: positive,
    // Each effect at Knowledge 100: shares of an output, or Well-being points.
    effects: z.strictObject({ production: share, office: share, tax: share, wellbeing: count, waste: share, power: share }),
    // Under Hard, a Home below this Knowledge is sanctioned in proportion to the shortfall.
    requiredKnowledge: z.number().gt(0).max(100),
  })
  .meta({ title: 'Knowledge balance', description: 'assets/defs/balance/knowledge.json: what builds Knowledge, and what it gives.' });

// How far fast public transport carries a Public facility's Service coverage; the stops themselves are building definitions.
export const transitReachBalanceSchema = z
  .strictObject({
    ...schemaField,
    // Longest travel time, in game minutes, of the Transit itinerary joining the stop near a facility to the stop near a Home.
    maxMinutes: positive,
  })
  .meta({ title: 'Transit reach balance', description: 'assets/defs/balance/transitReach.json: the travel time within which fast public transport extends Service coverage.' });

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
    // How many of the latest things the politics did by itself are kept for the Mayor to read.
    journalSize: z.int().min(1),
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
