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

interface RulesPageProps {
  id: CodexPage;
}

export function RulesPage({ id }: RulesPageProps) {
  const state = useReaderState();
  return (
    <article className="guide-rules max-w-4xl">
      {id === 'economy' && <CropEconomyRules state={state} />}
      {id === 'energy' && <EnergyProductionRules state={state} />}
      {id === 'storage' && <StorageRules state={state} />}
      {id === 'sanctions' && <SanctionsRules state={state} />}
      {id === 'market' && <MarketRules state={state} />}
      {id === 'challenges' && <ChallengesPage />}
      {id === 'solidarity' && <SolidarityPage />}
      {id === 'waste' && <WasteRules state={state} />}
      {id === 'transitReach' && <TransitReachRules state={state} />}
      {id === 'politics' && <PoliticsRules state={state} />}
    </article>
  );
}
