import { congestionStats, type Building } from '../../core';
import { t } from '../../i18n/t';
import { DrawerPanel } from '../common/DrawerPanel';
import { useGame } from '../common/hooks';

export function SportCourtVisitors({ building }: { building: Building }) {
  const visitors = useGame((store) => congestionStats(store.state).walkArrivals.get(building.id) ?? 0);
  if (visitors <= 0) return <DrawerPanel><p>{t('panel.sportUnused')}</p></DrawerPanel>;
  return <DrawerPanel><DrawerPanel.LabelValue label={t('panel.sportVisitors')} value={String(Math.round(visitors))} /></DrawerPanel>;
}
