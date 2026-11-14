import type { ComponentType } from 'react';
import type { CodexPage } from '../../codex/pages';
import type { GameState } from '../../core';
import { AnalyticsPage } from './AnalyticsPage';
import { AnnualEventsRules } from './AnnualEventsRules';
import { ChallengesPage } from './ChallengesPage';
import { ClimateRules } from './ClimateRules';
import { CropEconomyRules } from './CropEconomyRules';
import { DayCycleRules } from './DayCycleRules';
import { EnergyProductionRules } from './EnergyProductionRules';
import { ProductionInteriorsRules } from './ProductionInteriorsRules';
import { ServiceInteriorsRules } from './ServiceInteriorsRules';
import { KnowledgeRules } from './KnowledgeRules';
import { MarketRules } from './MarketRules';
import { PoliticsRules } from './PoliticsRules';
import { ProductionChainsRules } from './ProductionChainsRules';
import { RecurringCostsRules } from './RecurringCostsRules';
import { SanctionsRules } from './SanctionsRules';
import { SolidarityPage } from './SolidarityPage';
import { StaffRules } from './StaffRules';
import { StorageRules } from './StorageRules';
import { TransitReachRules } from './TransitReachRules';
import { WasteRules } from './WasteRules';
import { useRulesState } from './rulesStateContext';

interface RulesProps {
  state: GameState;
}

const RULES: Record<CodexPage, ComponentType<RulesProps>> = {
  economy: CropEconomyRules,
  energy: EnergyProductionRules,
  storage: StorageRules,
  sanctions: SanctionsRules,
  market: MarketRules,
  challenges: ChallengesPage,
  solidarity: SolidarityPage,
  knowledge: KnowledgeRules,
  waste: WasteRules,
  transitReach: TransitReachRules,
  chains: ProductionChainsRules,
  analytics: AnalyticsPage,
  costs: RecurringCostsRules,
  dayCycle: DayCycleRules,
  annualEvents: AnnualEventsRules,
  climate: ClimateRules,
  staff: StaffRules,
  productionInteriors: ProductionInteriorsRules,
  serviceInteriors: ServiceInteriorsRules,
  politics: PoliticsRules,
};

interface RulesContentProps {
  id: CodexPage;
}

export function RulesContent({ id }: RulesContentProps) {
  const Rules = RULES[id];
  return <Rules state={useRulesState()} />;
}
