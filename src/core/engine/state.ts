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
export type { ArcadeFixtureId, FixtureId, HotelFixtureId, SupermarketFixtureId } from '../venues/fixtureTypes.generated';
import type { FixtureId } from '../venues/fixtureTypes.generated';

export interface VenueFixture extends Coord {
  id: number;
  type: FixtureId;
  rotation: Rotation;
  condition?: number;
  broken?: boolean;
  good?: GoodId;
  stock?: number;
}

export interface VenueEvent {
  startsAt: number;
  endsAt: number;
  budget: number;
}

export type StaffRole = 'manager' | 'employee' | 'technician' | 'security' | 'cashier' | 'stocker' | 'receptionist' | 'housekeeper';

export interface VenueData {
  fixtures: VenueFixture[];
  nextFixtureId: number;
  takings: number;
  // Net earnings made since the Venue opened; it sets the Rank.
  earned?: number;
  // Urbs collected from the Takings since the Venue opened; `earned` counts at accrual, so it cannot tell a collection.
  collected?: number;
  price?: number;
  staff?: Partial<Record<StaffRole, number>>;
  rng?: number;
  reputation?: number;
  event?: VenueEvent;
  cooldownUntil?: number;
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
}

export interface Storage {
  materials: Partial<Record<MaterialId, number>>;
  goods: Partial<Record<GoodId, number>>;
}

export interface RoadTile extends Coord {
  kind: RoadKind;
  tier?: number;
}

export interface PedestrianWayTile extends Coord {
  tier?: number;
}

export interface BusLine {
  id: number;
  stops: number[];
  loop?: boolean;
}

export type TransitMode = 'bus' | 'brt' | 'rail';
export type TransitVehicleKind = FleetVehicleId;
export interface TransitVehicle {
  id: number;
  kind: TransitVehicleKind;
  purchasePrice: number;
  lineId?: number;
}
export interface TransitLine extends BusLine {
  mode: 'brt' | 'rail';
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

export type BoatFamily = 'pleasure' | 'fishing' | 'casino';

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

export interface GameState {
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
  roundabouts: Coord[];
  tutorial: TutorialStep | null;
  // Absent: not started. null: finished or skipped.
  venueTutorials?: Partial<Record<VenueTutorialType, VenueTutorialStep | null>>;
  tradeLedger: TradeLedgerEntry[];
}
