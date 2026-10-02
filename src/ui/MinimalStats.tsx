import { totalCitizens } from '../core';
import { t } from '../i18n/t';
import { useGame } from './hooks';

export function MinimalStats() {
  const urbs = useGame((store) => store.state.urbs);
  const citizens = useGame((store) => totalCitizens(store.state));
  return (
    <div className="minimal-stats">
      <strong>{urbs}</strong> {t('stat.urbs')} · 👥 {citizens}
    </div>
  );
}
