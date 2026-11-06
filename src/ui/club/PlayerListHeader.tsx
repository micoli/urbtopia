import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { Icon } from '../common/Icon';
import type { PlayerSort, PlayerSortKey } from './playerSort';

const COLUMNS: { key: PlayerSortKey; label: MessageKey; className?: string }[] = [
  { key: 'name', label: 'club.player.name', className: 'club-row__name' },
  { key: 'position', label: 'club.player.position' },
  { key: 'rating', label: 'club.player.rating' },
  { key: 'form', label: 'club.player.form' },
  { key: 'age', label: 'club.player.age' },
  { key: 'wage', label: 'club.player.wage' },
];

interface PlayerListHeaderProps {
  withAction?: boolean;
  // Without onSort the headers are plain labels (lists whose order matters, like starters).
  sort?: PlayerSort | null;
  onSort?: (key: PlayerSortKey) => void;
}

export function PlayerListHeader({ withAction = false, sort = null, onSort }: PlayerListHeaderProps) {
  return (
    <li className="club-row club-row--header" aria-hidden={onSort ? undefined : true}>
      <div className="club-row__main">
        {COLUMNS.map(({ key, label, className }) => {
          if (!onSort) return <span key={key} className={className}>{t(label)}</span>;
          const active = sort?.key === key;
          return (
            <button key={key} type="button" className={className ? `club-sort ${className}` : 'club-sort'} aria-pressed={active} onClick={() => onSort(key)}>
              {t(label)}
              {active && <Icon name={sort.descending ? 'chevronDown' : 'chevronUp'} />}
            </button>
          );
        })}
      </div>
      {withAction && <span className="club-row__action" />}
    </li>
  );
}
