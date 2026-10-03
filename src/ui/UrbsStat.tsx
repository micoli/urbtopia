import { t } from '../i18n/t';
import { useGame } from './hooks';
import { UrbsSymbol } from './UrbsSymbol';

export function UrbsStat() {
  const urbs = useGame((store) => store.state.urbs);
  return (
    <div className="dock-stat" title={t('stat.urbs')}>
      <span className="dock-stat-value">{urbs}</span>
      <span className="dock-stat-label">
        <UrbsSymbol />
      </span>
    </div>
  );
}
