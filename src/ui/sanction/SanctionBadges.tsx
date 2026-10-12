import { useSanctionedHomes } from '../common/useSanctionedHomes';
import { SanctionBadge } from './SanctionBadge';

export function SanctionBadges() {
  const homes = useSanctionedHomes();
  return <>{homes.map((entry) => <SanctionBadge key={entry.home.id} entry={entry} />)}</>;
}
