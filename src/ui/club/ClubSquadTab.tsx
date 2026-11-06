import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { PlayerListHeader } from './PlayerListHeader';
import { sortPlayers, usePlayerSort } from './playerSort';
import { PlayerRow } from './PlayerRow';

export function ClubSquadTab({ building }: { building: Building }) {
  const club = building.club!;
  const { sort, onSort } = usePlayerSort({ key: 'rating', descending: true });
  return (
    <ul className="club-list" aria-label={t('club.tab.squad')}>
      <PlayerListHeader withAction sort={sort} onSort={onSort} />
      {sortPlayers(club.squad, sort).map(player => (
        <PlayerRow key={player.id} player={player} action={<ActionButton variant="default" onClick={() => gameStore.getState().send({ type: 'ReleasePlayer', buildingId: building.id, playerId: player.id })}>{t('club.release')}</ActionButton>} />
      ))}
    </ul>
  );
}
