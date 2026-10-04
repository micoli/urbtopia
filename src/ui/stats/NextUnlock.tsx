import { nextUnlock, totalCitizens } from '../../core';
import { t } from '../../i18n/t';
import { itemName } from '../../i18n/itemName';
import { useGame } from '../common/hooks';

export function NextUnlock() {
  const state = useGame((store) => store.state);
  const next = nextUnlock(state);
  if (!next) return null;

  return (
    <div className="next-unlock">
      {totalCitizens(state)}/{next.citizens} {t('stat.citizens')}: {next.items.map((item) => itemName(item)).join(', ')}
    </div>
  );
}
