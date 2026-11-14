import type { ComponentType } from 'react';
import type { CodexPage } from '../../codex/pages';
import { AnalyticsPage } from './AnalyticsPage';
import { AnnualEventsPage } from './AnnualEventsPage';
import { ChallengesPage } from './ChallengesPage';
import { ClimatePage } from './ClimatePage';
import { CropEconomyPage } from './CropEconomyPage';
import { DayCyclePage } from './DayCyclePage';
import { EnergyProductionPage } from './EnergyProductionPage';
import { ProductionInteriorsPage } from './ProductionInteriorsPage';
import { ServiceInteriorsPage } from './ServiceInteriorsPage';
import { KnowledgePage } from './KnowledgePage';
import { MarketRulesPage } from './MarketRulesPage';
import { PoliticsPage } from './PoliticsPage';
import { ProductionChainsPage } from './ProductionChainsPage';
import { RecurringCostsPage } from './RecurringCostsPage';
import { SanctionsPage } from './SanctionsPage';
import { SolidarityPage } from './SolidarityPage';
import { StaffPage } from './StaffPage';
import { StorageRulesPage } from './StorageRulesPage';
import { TransitReachPage } from './TransitReachPage';
import { WastePage } from './WastePage';

export const CODEX_PAGE_COMPONENTS: Record<CodexPage, ComponentType> = {
  economy: CropEconomyPage,
  storage: StorageRulesPage,
  energy: EnergyProductionPage,
  sanctions: SanctionsPage,
  market: MarketRulesPage,
  challenges: ChallengesPage,
  solidarity: SolidarityPage,
  waste: WastePage,
  politics: PoliticsPage,
  transitReach: TransitReachPage,
  chains: ProductionChainsPage,
  analytics: AnalyticsPage,
  knowledge: KnowledgePage,
  costs: RecurringCostsPage,
  dayCycle: DayCyclePage,
  annualEvents: AnnualEventsPage,
  climate: ClimatePage,
  staff: StaffPage,
  productionInteriors: ProductionInteriorsPage,
  serviceInteriors: ServiceInteriorsPage,
};
