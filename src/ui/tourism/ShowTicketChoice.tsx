import { TICKETS, isAttraction, ticketOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { UrbsAmount } from '../common/UrbsAmount';

export function ShowTicketChoice({ building }: { building: Building }) {
  const options = TICKETS.map((ticket, level) => ({ value: level, label: <UrbsAmount value={ticket.price} /> }));
  return (
    <div className="show-starts">
      <p className="tourism-label">{t('attraction.ticket')}</p>
      <RadioChipGroup className="choice-chips" label={t('attraction.ticket')} options={options} value={ticketOf(building)} onChange={level => gameStore.getState().send({ type: 'SetTicket', buildingId: building.id, level })} />
      {isAttraction(building) ? <p className="tourism-help">{t('show.ticketVisits')}</p> : null}
    </div>
  );
}
