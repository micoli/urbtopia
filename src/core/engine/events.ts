import type { FacilityType } from '../services/facilities';
import type { CropId } from '../farming/crops';
import type { ItemId } from '../economy/items';
import type { BlackjackOutcome } from '../leisure/blackjack';
import type { SlotOutcome, SlotSymbol } from '../leisure/slotMachine';

export type GameEvent =
  | { readonly type: 'RoadBuilt'; readonly tiles: number }
  | { readonly type: 'BuildingPlaced'; readonly id: number }
  | { readonly type: 'BuildingSold'; readonly id: number }
  | { readonly type: 'BuildingMoved'; readonly id: number }
  | { readonly type: 'ProductionCompleted'; readonly buildingId: number; readonly item: ItemId; readonly at: number }
  | { readonly type: 'ItemsCollected'; readonly buildingId: number }
  | { readonly type: 'BuildingUpgraded'; readonly buildingId: number; readonly tier: number }
  | { readonly type: 'OfflineTimeCapped'; readonly forfeitedMs: number }
  | { readonly type: 'StorageFull'; readonly buildingId: number }
  | { readonly type: 'FacilityUnlocked'; readonly facility: FacilityType | 'casino' }
  | { readonly type: 'SlotSpun'; readonly buildingId: number; readonly stake: number; readonly reels: readonly SlotSymbol[]; readonly outcome: SlotOutcome; readonly payout: number }
  | { readonly type: 'CasinoRoundStarted'; readonly buildingId: number; readonly game: 'blackjack' | 'blockmatch'; readonly stake: number; readonly roundSeed: number }
  | { readonly type: 'BlackjackSettled'; readonly buildingId: number; readonly stake: number; readonly doubled: boolean; readonly outcome: BlackjackOutcome; readonly payout: number }
  | { readonly type: 'CropsHarvested'; readonly tiles: readonly { x: number; y: number; species: CropId }[] };
