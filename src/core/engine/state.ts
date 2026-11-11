import type { PirateShowTitle } from '../tourism/pirateShows';
import type { ClubData } from '../clubs/clubTypes';
import type { ChallengeClaim, ChallengeProgress } from '../challenges/types';
import type { TradeLedgerEntry } from '../trade/types';
import type { FleetVehicleId } from '../transit/transitVehicleTypes.generated';
import type { BuildingId } from '../buildings/buildingTypes.generated';
import type { Direction } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { GoodId, ItemId, MaterialId } from '../economy/items';
import type { CropId } from '../farming/crops';
import type { RoadKind } from '../map/roads';
import type { TutorialStep } from '../progression/tutorial';
import type { VenueTutorialStep, VenueTutorialType } from '../progression/venueTutorial';
import type { Difficulty } from './difficulty';
import type { PoliticsState } from '../politics/politics';
import type { DonationRecord } from '../economy/solidarity';

export type BuildingType = BuildingId;

export interface OpenCasinoRound {
  buildingId: number;
  game: 'blackjack' | 'blockmatch';
  stake: number;
  roundSeed: number;
}

export type Rotation = 0 | 1 | 2 | 3;
export type ColorVariant = 'default' | 'a' | 'b' | 'c';

export type ParcelCoord = Coord;

export interface QueueEntry {
  item: ItemId;
  duration: number;
  startedAt: number | null;
  done: boolean;
  quantity: number;
  // Packhouse: the Exit whose Restocker queued this production.
  exitId?: number;
}

export interface ShopStack {
  good: GoodId | null;
  stock: number;
  nextSaleAt: number | null;
  earned: number;
}

export interface MarketPrice {
  points: number;
  updatedAt: number;
}

export type { VenueType } from '../buildings/buildingTypes.generated';
export type { ArcadeFixtureId, FixtureId, HotelFixtureId, RestaurantFixtureId, SupermarketFixtureId } from '../venues/fixtureTypes.generated';
import type { FixtureId } from '../venues/fixtureTypes.generated';

export interface VenueFixture extends Coord {
  id: number;
  type: FixtureId;
  rotation: Rotation;
  condition?: number;
  broken?: boolean;
  good?: GoodId;
  stock?: number;
  // Exit of a Packhouse floor: the packed Good its Line restarts, and whether a Restocker is assigned to it.
  restock?: GoodId;
  restocker?: true;
}

export interface VenueEvent {
  startsAt: number;
  endsAt: number;
  budget: number;
}

export type StaffRole = 'manager' | 'employee' | 'technician' | 'security' | 'cashier' | 'stocker' | 'receptionist' | 'housekeeper' | 'cook' | 'kitchenAssistant' | 'maitreD' | 'waiter' | 'bartender';

// The interior of a Factory: the Fixtures the player placed, like a Venue's, without Takings or Visitors.
export interface FloorData {
  fixtures: VenueFixture[];
  nextFixtureId: number;
  // The part of a unit of yield that the Machines added and no cycle has paid out yet, from 0 to 1 excluded.
  carry?: number;
  // Home interior: the floor chosen among the parquets, 0 when left out.
  parquet?: number;
  // Technicians hired for the floor; they repair worn Fixtures by the hour and slow their wear.
  technicians?: number;
  // Restockers hired for a Packhouse floor; each is assigned by hand to an Exit.
  restockers?: number;
  // The floor's own stream of the game's Seed, for its breakdowns.
  rng?: number;
}

export interface VenueData {
  fixtures: VenueFixture[];
  nextFixtureId: number;
  takings: number;
  // Net earnings made since the Venue opened; it sets the Rank.
  earned?: number;
  // Urbs collected from the Takings since the Venue opened; `earned` counts at accrual, so it cannot tell a collection.
  collected?: number;
  price?: number;
  // Restaurant: the ingredients it serves.
  menu?: ItemId[];
  // Restaurant: fractions of units eaten and not yet taken from the Storehouse, which only holds whole units.
  eaten?: Partial<Record<ItemId, number>>;
  staff?: Partial<Record<StaffRole, number>>;
  rng?: number;
  reputation?: number;
  event?: VenueEvent;
  cooldownUntil?: number;
}

// A one-day crowd event held in an Attraction: its crowd is fixed when it is scheduled, its Ticket revenue paid when it ends.
export interface GatheringData {
  kind: 'show' | 'match' | 'meeting';
  startsAt: number;
  endsAt: number;
  cost: number;
  quality: number;
  // The Artist who plays a Concert hall Show.
  artist?: string;
  // The title drawn for a Pirate cove Show.
  title?: PirateShowTitle;
  crowd: number;
  tourists: number;
  citizens: number;
  revenue: number;
}

// What the last Gathering of an Attraction drew and earned, for the player to compare.
export interface GatheringResult {
  kind: GatheringData['kind'];
  at: number;
  crowd: number;
  revenue: number;
  cost: number;
  artist?: string;
  title?: PirateShowTitle;
}

// Ticket level of an Attraction (0 lowest), the Urbs its Tourists have paid and nobody has collected, and its Gathering.
export interface AttractionData {
  ticket?: number;
  takings: number;
  gathering?: GatheringData;
  lastGathering?: GatheringResult;
  cooldownUntil?: number;
  // Shows scheduled so far: with the building it seeds the Artists offered for the next one.
  shows?: number;
  // A Championship's success draws a bigger crowd to the next Match.
  nextMatchBoost?: boolean;
  // The Meeting slot last set, so the same one is not set twice.
  meetingAt?: number;
}

export interface Building extends Coord {
  id: number;
  type: BuildingType;
  rotation: Rotation;
  slotCount: number;
  queue: QueueEntry[];
  stacks: ShopStack[];
  tier: number;
  taxCitizenMs: number;
  insulated?: boolean;
  solar?: boolean;
  colorVariant?: ColorVariant;
  storedEnergy?: number;
  coalEnabled?: boolean;
  name?: string;
  venue?: VenueData;
  floor?: FloorData;
  attraction?: AttractionData;
  club?: ClubData;
  // Stands only: the Pirate cove they belong to.
  coveId?: number;
}

export interface Storage {
  materials: Partial<Record<MaterialId, number>>;
  goods: Partial<Record<GoodId, number>>;
}

export interface RoadTile extends Coord {
  kind: RoadKind;
  tier?: number;
}

// A stair down to Level -1; its open front turns towards `rotation`, as a building does, or towards the walking surface it stands against.
export interface PedestrianAccess extends Coord {
  rotation?: Rotation;
}

export interface PedestrianWayTile extends Coord {
  tier?: number;
}

export interface BusLine {
  id: number;
  stops: number[];
  loop?: boolean;
}

// The modes that run on a network of their own: BRT corridor, Railway, and the Tunnels of Level -2 for the Metro.
export type NetworkMode = 'brt' | 'rail' | 'metro';
export type TransitMode = 'bus' | NetworkMode;
export type TransitVehicleKind = FleetVehicleId;
export interface TransitVehicle {
  id: number;
  kind: TransitVehicleKind;
  purchasePrice: number;
  lineId?: number;
}
export interface TransitLine extends BusLine {
  mode: NetworkMode;
  peakHeadway: number;
  offPeakHeadway: number;
}
export interface TransitTile extends Coord {
  exits: Direction[];
  kind?: 'crossing';
}

export interface PlantedCrop {
  species: CropId;
  plantedAt: number;
}

export type BoatFamily = 'pleasure' | 'fishing' | 'casino' | 'pirate' | 'frigate';

export interface Boat extends Coord {
  id: number;
  family: BoatFamily;
  marinaId: number;
  catchSince?: number;
  tier?: number;
}

export interface Bridge extends Coord {
  length: number;
  axis: 'x' | 'y';
  carrier?: 'road' | 'brt' | 'pedestrian';
  side?: 1 | -1;
  tier?: number;
}

export interface FieldTile extends Coord {
  crop?: PlantedCrop;
}

export type SeedStock = Partial<Record<string, number>>;

// What a Replan has lifted off the map and the player has not placed again; each object is kept whole.
export interface Stash {
  buildings: Building[];
  roads?: RoadTile[];
  pedestrianWays?: PedestrianWayTile[];
  walkways?: Coord[];
  pedestrianAccesses?: PedestrianAccess[];
  waterTiles?: Coord[];
  fields?: FieldTile[];
  roundabouts?: Coord[];
  brtRoads?: TransitTile[];
  rails?: TransitTile[];
  tunnels?: TransitTile[];
  bridges?: Bridge[];
  boats?: Boat[];
}

// Everything a Replan lifts off the map or leaves on it: the layout the player can change.
export interface Layout {
  buildings: Building[];
  roads: RoadTile[];
  pedestrianWays?: PedestrianWayTile[];
  walkways?: Coord[];
  pedestrianAccesses?: PedestrianAccess[];
  tunnels?: TransitTile[];
  roundabouts: Coord[];
  waterTiles?: Coord[];
  boats?: Boat[];
  bridges?: Bridge[];
  brtRoads?: TransitTile[];
  rails?: TransitTile[];
  fields: FieldTile[];
  busLines?: BusLine[];
  transitLines?: TransitLine[];
  transitFleet?: TransitVehicle[];
}

export interface ReplanState {
  stash: Stash;
  // The layout the Replan started from, which Cancel restores.
  start?: Layout;
  // Urbs the player took by dropping items of the Stash; Cancel gives them back with the items.
  refunded?: number;
  // The groups of the Stash the player put off to the bottom of the list.
  later?: string[];
}

export interface GameState {
  // Present only while a Replan lasts.
  replan?: ReplanState;
  solidarityMs?: number;
  donations?: DonationRecord[];
  seedStock: SeedStock;
  fields: FieldTile[];
  waterTiles?: Coord[];
  boats?: Boat[];
  bridges?: Bridge[];
  brtRoads?: TransitTile[];
  rails?: TransitTile[];
  transitLines?: TransitLine[];
  transitFleet?: TransitVehicle[];
  timeOffset?: number;
  dayCycleOffset?: number;
  busLines?: BusLine[];
  adaptationUntil?: number;
  ecologyDismissed?: boolean;
  difficulty?: Difficulty;
  politics?: PoliticsState;
  challenge?: ChallengeProgress;
  challengeClaims?: ChallengeClaim[];
  seed: string;
  rngState: number;
  casinoRng?: number;
  openRound?: OpenCasinoRound;
  urbs: number;
  lastSeen: number;
  nextId: number;
  ownedParcels: ParcelCoord[];
  buildings: Building[];
  storage: Storage;
  marketUnlocked: boolean;
  market: Partial<Record<GoodId, MarketPrice>>;
  roads: RoadTile[];
  pedestrianWays?: PedestrianWayTile[];
  // Level -1: Underground walkways. They lie under anything on the Surface and never occupy a Surface tile.
  walkways?: Coord[];
  // Surface tiles holding a stair down to Level -1.
  pedestrianAccesses?: PedestrianAccess[];
  // Level -2: Tunnels of the Metro, drawn like rails with their exits.
  tunnels?: TransitTile[];
  roundabouts: Coord[];
  tutorial: TutorialStep | null;
  // Absent: not started. null: finished or skipped.
  venueTutorials?: Partial<Record<VenueTutorialType, VenueTutorialStep | null>>;
  tradeLedger: TradeLedgerEntry[];
}
