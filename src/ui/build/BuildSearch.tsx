import { t } from '../../i18n/t';

interface BuildSearchProps {
  query: string;
  onChange: (query: string) => void;
}

export function BuildSearch({ query, onChange }: BuildSearchProps) {
  return (
    <div className="build-search">
      <input type="search" value={query} aria-label={t('build.search')} placeholder={t('build.searchPlaceholder')} onChange={event => onChange(event.target.value)} />
    </div>
  );
}
