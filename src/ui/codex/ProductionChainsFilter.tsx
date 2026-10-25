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
      <input className="codex-search" type="search" aria-label={t('codex.chains.filter')} placeholder={t('codex.chains.filter')} value={query} onChange={(event) => onQuery(event.target.value)} />
      <CheckboxField label={t('codex.chains.unlockedOnly')} checked={unlockedOnly} onChange={onUnlockedOnly} />
    </div>
  );
}
