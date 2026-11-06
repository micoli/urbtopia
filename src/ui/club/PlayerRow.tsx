import type { Player } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';

interface PlayerRowProps {
  player: Player;
  // The button at the end of the row.
  action?: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  // Plays the swap animation: the row comes in from the list it left.
  swapped?: 'from-above' | 'from-below';
  onSwapEnd?: () => void;
}

export function PlayerRow({ player, action, selected = false, onSelect, swapped, onSwapEnd }: PlayerRowProps) {
  const cells = (
    <>
      <span className="club-row__name">{player.name}</span>
      <span>{t(`club.position.${player.position}` as MessageKey)}</span>
      <span title={t('club.player.rating')}>{player.rating}</span>
      <span title={t('club.player.form')}>{Math.round(player.form)}</span>
      <span title={t('club.player.age')}>{player.age}</span>
      <span title={t('club.player.wage')}>{player.contract.wage}</span>
    </>
  );
  return (
    <li className={`club-row${selected ? ' club-row--selected' : ''}${swapped ? ` club-row--${swapped}` : ''}`} onAnimationEnd={onSwapEnd}>
      {onSelect ? <button type="button" className="club-row__main" aria-pressed={selected} onClick={onSelect}>{cells}</button> : <div className="club-row__main">{cells}</div>}
      {action && <span className="club-row__action">{action}</span>}
    </li>
  );
}
