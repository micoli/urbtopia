import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { PlayerRow } from './PlayerRow';

export function ClubSquadTab({ building }: { building: Building }) {
  const club = building.club!;
  return (
    <ul className="club-list" aria-label={t('club.tab.squad')}>
      {[...club.squad].sort((a, b) => b.rating - a.rating || a.id - b.id).map(player => (
        <PlayerRow key={player.id} player={player} action={<ActionButton variant="default" onClick={() => gameStore.getState().send({ type: 'ReleasePlayer', buildingId: building.id, playerId: player.id })}>{t('club.release')}</ActionButton>} />
      ))}
    </ul>
  );
}
