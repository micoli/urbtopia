import { VENUE, isVenue, priceOf, takingsCapOf, takingsDue, venuePerformance, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { useGame } from '../common/hooks';
import { NumberStepper } from '../common/NumberStepper';
import { UrbsAmount } from '../common/UrbsAmount';

interface VenueTakingsProps {
  building: Building;
  editable?: boolean;
}

export function VenueTakings({ building, editable = false }: VenueTakingsProps) {
  const state = useGame(store => store.state);
  if (!isVenue(building)) return null;
  const performance = venuePerformance(state, building);
  const due = takingsDue(building.venue);
  const full = building.venue.takings >= takingsCapOf(building.tier);
  return (
    <>
      <DrawerPanel.LabelValue label={t('venue.visitors')} value={performance.visitors.toFixed(1)} />
      <DrawerPanel.LabelValue label={t('venue.served')} value={performance.served.toFixed(1)} />
      <DrawerPanel.LabelValue label={t('venue.earnings')} value={<UrbsAmount value={performance.earningsPerHour} />} />
      {editable ? (
        <NumberStepper label={t('venue.price')} value={priceOf(building.venue)} min={VENUE.minPrice} max={VENUE.maxPrice} onChange={price => gameStore.getState().send({ type: 'SetVenuePrice', buildingId: building.id, price })} />
      ) : (
        <DrawerPanel.LabelValue label={t('venue.price')} value={<UrbsAmount value={priceOf(building.venue)} />} />
      )}
      {performance.capacity === 0 ? <p className="note note--warn">{t('venue.noFixture')}</p> : null}
      {full ? <p className="note note--warn">{t('venue.cap')}</p> : null}
      <ActionButton variant="primary" block disabled={due === 0} onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}>
        {t('venue.collect')} · <UrbsAmount value={due} /> / <UrbsAmount value={takingsCapOf(building.tier)} />
      </ActionButton>
    </>
  );
}
