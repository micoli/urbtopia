import type { CodexPage } from '../codex/pages';
import { ChallengesPage } from '../ui/codex/ChallengesPage';
import { CropEconomyRules } from '../ui/codex/CropEconomyRules';
import { EnergyProductionRules } from '../ui/codex/EnergyProductionRules';
import { MarketRules } from '../ui/codex/MarketRules';
import { PoliticsRules } from '../ui/codex/PoliticsRules';
import { SanctionsRules } from '../ui/codex/SanctionsRules';
import { SolidarityPage } from '../ui/codex/SolidarityPage';
import { StorageRules } from '../ui/codex/StorageRules';
import { TransitReachRules } from '../ui/codex/TransitReachRules';
import { WasteRules } from '../ui/codex/WasteRules';
import { useReaderState } from './reader/useReaderState';

interface RulesContentProps {
  id: CodexPage;
}

export function RulesContent({ id }: RulesContentProps) {
  const state = useReaderState();
  if (id === 'economy') return <CropEconomyRules state={state} />;
  if (id === 'energy') return <EnergyProductionRules state={state} />;
  if (id === 'storage') return <StorageRules state={state} />;
  if (id === 'sanctions') return <SanctionsRules state={state} />;
  if (id === 'market') return <MarketRules state={state} />;
  if (id === 'challenges') return <ChallengesPage />;
  if (id === 'solidarity') return <SolidarityPage />;
  if (id === 'waste') return <WasteRules state={state} />;
  if (id === 'transitReach') return <TransitReachRules state={state} />;
  return <PoliticsRules state={state} />;
}
