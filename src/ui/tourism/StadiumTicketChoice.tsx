import { TICKETS, previewNextGathering, ticketOf, type Building, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { Icon } from '../common/Icon';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { UrbsAmount } from '../common/UrbsAmount';

interface StadiumTicketChoiceProps {
  state: GameState;
  building: Building;
}

export function StadiumTicketChoice({ state, building }: StadiumTicketChoiceProps) {
  const options = TICKETS.map((ticket, level) => {
    const preview = previewNextGathering(state, { ...building, attraction: { takings: 0, ...building.attraction, ticket: level } });
    return {
      value: level,
      label: (
        <>
          <strong className="ticket-price"><UrbsAmount value={ticket.price} /></strong>
          <small title={t('show.crowd')}><Icon name="citizens" /> {Math.round(preview.crowd)}</small>
          <small><UrbsAmount value={preview.revenue} /></small>
        </>
      ),
    };
  });
  return (
    <>
      <p className="tourism-label">{t('attraction.ticket')}</p>
      <RadioChipGroup className="choice-chips ticket-choice" label={t('attraction.ticket')} options={options} value={ticketOf(building)} onChange={level => gameStore.getState().send({ type: 'SetTicket', buildingId: building.id, level })} />
      <p className="tourism-help">{t('stadium.ticketHelp')}</p>
    </>
  );
}
