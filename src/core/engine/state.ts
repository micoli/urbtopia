import type { BuildingId } from '../buildings/buildingTypes.generated';
import type { Direction } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { GoodId, ItemId, MaterialId } from '../economy/items';
import type { CropId } from '../farming/crops';
import type { RoadKind } from '../map/roads';
import type { TutorialStep } from '../progression/tutorial';

export type BuildingType = BuildingId;

export interface OpenCasinoRound {
  buildingId: number;
  game: 'blackjack' | 'blockmatch';
  stake: number;
  roundSeed: number;
}

export type Rotation = 0 | 1 | 2 | 3;
export type HomeColorVariant = 'default' | 'a' | 'b' | 'c';

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

export type VenueType = 'arcade' | 'supermarket' | 'hotel';

export type ArcadeFixtureId =
  | 'counter'
  | 'barrelClimber'
  | 'spaceShooter'
  | 'airHockey'
  | 'table'
  | 'chair'
  | 'barStool'
  | 'pinball'
  | 'billiard'
  | 'vendingMachine'
  | 'clawMachine'
  | 'basketball'
  | 'danceMachine'
  | 'prizeWheel'
  | 'ticketMachine'
  | 'arcadeWall'
  | 'arcadeWindow';

export type SupermarketFixtureId =
  | 'checkout'
  | 'shelfBags'
  | 'shelfBoxes'
  | 'displayBread'
  | 'displayFruit'
  | 'freezer'
  | 'freezerStanding'
  | 'shoppingBasket'
  | 'shoppingCart'
  | 'bottleReturn'
  | 'marketWall'
  | 'marketWindow';

export type HotelFixtureId =
  | 'receptionDesk'
  | 'singleBed'
  | 'doubleBed'
  | 'bunkBed'
  | 'toilet'
  | 'shower'
  | 'bathtub'
  | 'sofa'
  | 'television'
  | 'floorLamp'
  | 'rug'
  | 'pottedPlant'
  | 'coffeeCorner'
  | 'miniFridge'
  | 'hotelWall'
  | 'hotelWindow';

export type FixtureId = ArcadeFixtureId | SupermarketFixtureId | HotelFixtureId;

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
  colorVariant?: HomeColorVariant;
  storedEnergy?: number;
  coalEnabled?: boolean;
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

export interface BusLine {
  id: number;
  stops: number[];
}

export type TransitMode = 'bus' | 'brt' | 'rail';
export type TransitVehicleKind = 'brtElectric' | 'trainElectric' | 'trainCoal';
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
}

export interface FieldTile extends Coord {
  crop?: PlantedCrop;
}

export type SeedStock = Partial<Record<string, number>>;

export interface GameState {
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
  busLines?: BusLine[];
  adaptationUntil?: number;
  ecologyDismissed?: boolean;
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
  roundabouts: Coord[];
  tutorial: TutorialStep | null;
}
