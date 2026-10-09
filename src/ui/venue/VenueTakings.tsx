import { MAX_RANK, VENUE, earnedOf, hiredOf, isVenue, markupOf, netPerHour, nextRankAt, priceOf, takingsCapOf, takingsDue, venueRankOf, venueTypeOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { NumberStepper } from '../common/NumberStepper';
import { UrbsAmount } from '../common/UrbsAmount';
import { VenueHotelStats } from './VenueHotelStats';
import { useVenuePerformance } from './useVenuePerformance';

interface VenueTakingsProps {
  building: Building;
  editable?: boolean;
}

export function VenueTakings({ building, editable = false }: VenueTakingsProps) {
  const performance = useVenuePerformance(building.id);
  if (!isVenue(building) || !performance) return null;
  const due = takingsDue(building.venue);
  const type = venueTypeOf(building);
  const rank = venueRankOf(building);
  const nextAt = nextRankAt(type, rank);
  const full = building.venue.takings >= takingsCapOf(building.tier);
  return (
    <>
      {performance.powered ? null : <p className="note note--warn">{t('venue.shut')}</p>}
      {type === 'hotel' ? null : <DrawerPanel.LabelValue label={t(`venue.capacity.${type}`)} value={performance.capacity.toFixed(1)} />}
      <DrawerPanel.LabelValue label={t(`venue.visitors.${type}`)} value={performance.visitors.toFixed(1)} />
      <DrawerPanel.LabelValue label={t('venue.attractiveness')} value={`${Math.round(performance.layout.attractiveness * 100)} %`} />
      <DrawerPanel.LabelValue label={t('venue.serviceRate')} value={`${Math.round(performance.layout.counterRate * 100)} %`} />
      {type === 'hotel' ? null : <DrawerPanel.LabelValue label={t(`venue.served.${type}`)} value={performance.served.toFixed(1)} />}
      <DrawerPanel.LabelValue label={t('venue.rank')} value={rank >= MAX_RANK || nextAt === undefined ? `${rank}` : `${rank} · ${Math.floor(earnedOf(building.venue))} / ${nextAt}`} />
      <DrawerPanel.LabelValue label={t('venue.earnings')} value={<UrbsAmount value={performance.earningsPerHour} />} />
      {editable && hiredOf(building.venue, 'manager') > 0 ? (
        <NumberStepper label={t(`venue.price.${type}`)} value={priceOf(building.venue)} min={VENUE.minPrice} max={VENUE.maxPrice} onChange={price => gameStore.getState().send({ type: 'SetVenuePrice', buildingId: building.id, price })} />
      ) : (
        <DrawerPanel.LabelValue label={t(`venue.price.${type}`)} value={type === 'arcade' ? <UrbsAmount value={priceOf(building.venue)} /> : type === 'supermarket' ? `${Math.round(markupOf(priceOf(building.venue)) * 100)} %` : priceOf(building.venue)} />
      )}
      {editable && hiredOf(building.venue, 'manager') === 0 ? <p className="note note--muted">{t('venue.priceLocked')}</p> : null}
      <DrawerPanel.LabelValue label={t('venue.wages')} value={<UrbsAmount value={performance.wagesPerHour} />} />
      <DrawerPanel.LabelValue label={t('venue.net')} value={<UrbsAmount value={netPerHour(performance)} />} />
      {performance.closed ? <p className="note note--warn">{t('venue.closed')}</p> : null}
      {performance.capacity === 0 && !performance.closed ? <p className="note note--warn">{t(`venue.empty.${type}`)}</p> : null}
      {type === 'hotel' ? <VenueHotelStats venue={building.venue} performance={performance} /> : null}
      {full ? <p className="note note--warn">{t('venue.cap')}</p> : null}
      <ActionButton variant="primary" block disabled={due === 0} onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}>
        {t('venue.collect')} · <UrbsAmount value={due} /> / <UrbsAmount value={takingsCapOf(building.tier)} />
      </ActionButton>
    </>
  );
}
