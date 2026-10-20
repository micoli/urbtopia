import type { ComponentType } from 'react';
import type { Building, BuildingKind } from '../../core';
import { CasinoPanel } from '../casino/CasinoPanel';
import { VenuePanel } from '../venue/VenuePanel';
import { FarmPanel } from './FarmPanel';
import { HomePanel } from './HomePanel';
import { MarinaPanel } from './MarinaPanel';
import { OfficePanel } from './OfficePanel';
import { ProductionPanel } from './ProductionPanel';
import { ShopPanel } from './ShopPanel';
import { StoragePanel } from './StoragePanel';

// The panel every building of a kind shows. Facility and utility panels need the building's own type, and the other panels depend on flags rather than on the kind.
export const PANEL_BY_KIND: Partial<Record<BuildingKind, ComponentType<{ building: Building }>>> = {
  production: ProductionPanel,
  farm: FarmPanel,
  home: HomePanel,
  marina: MarinaPanel,
  casino: CasinoPanel,
  venue: VenuePanel,
  shop: ShopPanel,
  office: OfficePanel,
  storage: StoragePanel,
};
