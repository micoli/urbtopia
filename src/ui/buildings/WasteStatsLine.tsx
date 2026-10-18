import { wasteReport, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';

interface WasteStatsLineProps {
  state: GameState;
}

export function WasteStatsLine({ state }: WasteStatsLineProps) {
  const report = wasteReport(state);
  if (report.produced === 0) return null;
  return (
    <p className="waste-stats-line">
      {t('stats.waste')}: {t('stats.waste.produced')} {report.produced.toFixed(0)} · {t('stats.waste.processed')} {report.processed.toFixed(0)} · {t('stats.waste.cost')} <UrbsAmount value={report.costPerDay} />
    </p>
  );
}
