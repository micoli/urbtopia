import { t } from '../i18n/t';
import { totalCitizens } from '../core';
import { useGame, useUi } from './hooks';
import { UrbsSymbol } from './UrbsSymbol';

export function MinimalStats() {
  const toggleStats = useUi(s => s.toggleStats);
  const urbs = useGame((store) => store.state.urbs);
  const citizens = useGame((store) => totalCitizens(store.state));
  return (
    <button type="button" className="minimal-stats" aria-label={t('eco.title')} onClick={toggleStats}>
      <strong>{Math.floor(urbs)}</strong> <UrbsSymbol /> · 👥 {citizens}
    </button>
  );
}
