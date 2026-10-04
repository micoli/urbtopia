import type { transportStats } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { useGame } from '../../../common/hooks.ts';
import { FleetLineTable } from './FleetLineTable.tsx';
import { FleetPurchase } from './FleetPurchase.tsx';
import { FleetTable } from './FleetTable.tsx';

export function FleetManager({ transport }: { transport: ReturnType<typeof transportStats> }) {
  const state = useGame(s => s.state);
  return <div className="transit-fleet">
    <FleetPurchase />
    <FleetTable state={state} transport={transport} />
    <h4>{t('transit.lines')}</h4>
    <FleetLineTable transport={transport} />
  </div>;
}
