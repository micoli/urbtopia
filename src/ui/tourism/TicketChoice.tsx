import { TICKETS, earningsPerHour, ticketOf, touristsPerDay, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { UrbsAmount } from '../common/UrbsAmount';

interface TicketChoiceProps {
  building: Building;
  attractiveness: number;
  spending: number;
}

export function TicketChoice({ building, attractiveness, spending }: TicketChoiceProps) {
  const options = TICKETS.map((ticket, level) => {
    const priced = { ...building, attraction: { takings: 0, ...building.attraction, ticket: level } };
    return {
      value: level,
      label: (
        <>
          <strong className="ticket-price"><UrbsAmount value={ticket.price} /></strong>
          <small>{t('attraction.ticketTourists').replace('{count}', `${Math.round(touristsPerDay(priced, attractiveness))}`)}</small>
          <small><UrbsAmount value={earningsPerHour(priced, attractiveness, spending)} />{t('attraction.perHour')}</small>
        </>
      ),
    };
  });
  return (
    <>
      <RadioChipGroup className="choice-chips ticket-choice" label={t('attraction.ticket')} options={options} value={ticketOf(building)} onChange={level => gameStore.getState().send({ type: 'SetTicket', buildingId: building.id, level })} />
      <p className="tourism-help">{t('attraction.ticketHelp')}</p>
    </>
  );
}
