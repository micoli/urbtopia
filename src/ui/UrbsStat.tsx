import { t } from '../i18n/t';
import { useGame } from './hooks';

export function UrbsStat() {
  const urbs = useGame((store) => store.state.urbs);
  return (
    <div className="dock-stat" title={t('stat.urbs')}>
      <span className="dock-stat-value">{urbs}</span>
      <span className="dock-stat-label">{t('stat.urbs')}</span>
    </div>
  );
}
