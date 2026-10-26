import { isMaterial } from '../../core';
import { readRegistry } from '../../persistence/cities';
import { openCityId, rawSaveStore } from '../../persistence/instance';
import { t } from '../../i18n/t';
import { Note } from '../common/Note';
import { useGame, useShipments } from '../common/hooks';
import type { StockLine } from '../social/exchanges/LotLineRow';
import { ShipmentForm } from './ShipmentForm';
import { ShipmentList } from './ShipmentList';

export function ShipmentsSection() {
  const enabled = useShipments((store) => store.enabled);
  const status = useShipments((store) => store.status);
  const shipments = useShipments((store) => store.shipments);
  const waitingForRoom = useShipments((store) => store.waitingForRoom);
  const busy = useShipments((store) => store.busy);
  const failure = useShipments((store) => store.failure);
  const actions = useShipments((store) => store.actions);
  const storage = useGame((store) => store.state.storage);
  const registry = readRegistry(rawSaveStore);
  if (!enabled || !actions || !registry) return null;

  const here = openCityId();
  const nameOf = (cityId: string) => registry.cities.find((city) => city.id === cityId)?.name ?? '';
  const destinations = registry.cities.filter((city) => city.id !== here).map((city) => ({ id: city.id, name: city.name ?? '' }));
  const waiting = shipments.filter((shipment) => shipment.state === 'waiting');
  const outgoing = waiting.filter((shipment) => shipment.fromCityId === here);
  const incoming = waiting.filter((shipment) => shipment.toCityId === here);
  if (destinations.length === 0 && outgoing.length === 0 && incoming.length === 0) return null;

  const stock: StockLine[] = [...Object.entries(storage.materials), ...Object.entries(storage.goods)]
    .filter(([, quantity]) => (quantity ?? 0) > 0)
    .map(([item, quantity]) => ({ item, quantity: quantity ?? 0 }))
    .sort((a, b) => Number(isMaterial(b.item)) - Number(isMaterial(a.item)));

  return (
    <section className="shipments">
      <h3>{t('shipments.title')}</h3>
      <Note tone="muted">{t('shipments.intro')}</Note>
      {status === 'sign-in-required' && <Note tone="muted">{t('shipments.signIn')}</Note>}
      {destinations.length > 0 && stock.length > 0 && (
        <ShipmentForm destinations={destinations} stock={stock} busy={busy} online={status === 'ready'} failure={failure} onSubmit={actions.send} />
      )}
      <ShipmentList title={t('shipments.outgoing')} shipments={outgoing} direction="outgoing" nameOf={(shipment) => nameOf(shipment.toCityId)} waitingForRoom={waitingForRoom} busy={busy} onCancel={(id) => void actions.cancel(id)} />
      <ShipmentList title={t('shipments.incoming')} shipments={incoming} direction="incoming" nameOf={(shipment) => nameOf(shipment.fromCityId)} waitingForRoom={waitingForRoom} busy={busy} onCancel={() => {}} />
    </section>
  );
}
