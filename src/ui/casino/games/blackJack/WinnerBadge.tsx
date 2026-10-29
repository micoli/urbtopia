import { t } from '../../../../i18n/t.ts';
import { Icon } from '../../../common/Icon';

interface WinnerBadgeProps {
  side: 'player' | 'dealer';
  winner: 'player' | 'dealer' | 'push' | null;
}

export function WinnerBadge({ side, winner }: WinnerBadgeProps) {
  if (winner === null) return null;
  if (winner === 'push') return <span className="winner-badge" data-tie="true">{t('casino.tie')}</span>;
  if (winner !== side) return null;
  return <span className="winner-badge" data-side={side}><Icon name="trophy" />{t('casino.winner')}</span>;
}
