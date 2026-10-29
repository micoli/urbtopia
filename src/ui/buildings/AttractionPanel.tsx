import { TICKETS, attractionTakingsCapOf, attractionTakingsOf, cityAttractiveness, ticketOf, touristsPerDay, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { UrbsAmount } from '../common/UrbsAmount';
import { useGame } from '../common/hooks';

interface AttractionPanelProps {
  building: Building;
}

export function AttractionPanel({ building }: AttractionPanelProps) {
  const attractiveness = useGame(store => cityAttractiveness(store.state));
  const due = Math.floor(attractionTakingsOf(building));
  const cap = attractionTakingsCapOf(building);
  const options = TICKETS.map((ticket, level) => ({ value: level, label: <UrbsAmount value={ticket.price} /> }));
  return (
    <DrawerPanel>
      <DrawerPanel.LabelValue label={t('attraction.tourists')} value={Math.round(touristsPerDay(building, attractiveness))} />
      <RadioChipGroup label={t('attraction.ticket')} options={options} value={ticketOf(building)} onChange={level => gameStore.getState().send({ type: 'SetTicket', buildingId: building.id, level })} />
      {attractionTakingsOf(building) >= cap ? <p className="note note--warn">{t('attraction.cap')}</p> : null}
      <ActionButton variant="primary" block disabled={due === 0} onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}>
        {t('attraction.takings')} · <UrbsAmount value={due} /> / <UrbsAmount value={cap} />
      </ActionButton>
    </DrawerPanel>
  );
}
