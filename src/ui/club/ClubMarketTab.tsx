import { signingFeeOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { UrbsAmount } from '../common/UrbsAmount';
import { PlayerRow } from './PlayerRow';

export function ClubMarketTab({ building }: { building: Building }) {
  const club = building.club!;
  if (club.market.length === 0) return <p className="note note--muted">{t('club.marketEmpty')}</p>;
  return (
    <ul className="club-list" aria-label={t('club.tab.market')}>
      {club.market.map(player => (
        <PlayerRow key={player.id} player={player} action={
          <ActionButton variant="primary" disabled={club.budget < signingFeeOf(player)} onClick={() => gameStore.getState().send({ type: 'SignPlayer', buildingId: building.id, playerId: player.id })}>
            {t('club.sign')} · <UrbsAmount value={signingFeeOf(player)} />
          </ActionButton>
        } />
      ))}
    </ul>
  );
}
