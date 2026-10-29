import { SearchField } from '../common/SearchField';
import { t } from '../../i18n/t';
import { CheckboxField } from '../common/CheckboxField';

interface ProductionChainsFilterProps {
  query: string;
  unlockedOnly: boolean;
  onQuery: (query: string) => void;
  onUnlockedOnly: (unlockedOnly: boolean) => void;
}

export function ProductionChainsFilter({ query, unlockedOnly, onQuery, onUnlockedOnly }: ProductionChainsFilterProps) {
  return (
    <div className="codex-chain-filter">
      <SearchField label={t('codex.chains.filter')} value={query} onChange={onQuery} />
      <CheckboxField label={t('codex.chains.unlockedOnly')} checked={unlockedOnly} onChange={onUnlockedOnly} />
    </div>
  );
}
