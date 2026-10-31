import { BOATS, COVE_BOAT_FAMILIES, isCoveLocked, pirateShipLimit, pirateShipRoom, pirateShipsOfCove, seatCapOf, seatsOfCove, seatsOfStands, standsOfCove, totalCitizens, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { uiStore } from '../../store/uiStore';
import { ActionButton } from '../common/ActionButton';
import { BlockedReason } from '../common/BlockedReason';
import { DrawerPanel } from '../common/DrawerPanel';
import { Icon } from '../common/Icon';
import { UrbsAmount } from '../common/UrbsAmount';
import { useGame } from '../common/hooks';

export function PirateCovePanel({ building }: { building: Building }) {
  const state = useGame((store) => store.state);
  const ships = pirateShipsOfCove(state, building.id);
  const citizens = totalCitizens(state);
  const room = pirateShipRoom(state, building);
  const locked = isCoveLocked(state, building.id);
  const seats = standsOfCove(state, building.id).reduce((total, stands) => total + seatsOfStands(stands.type), 0);
  const cap = seatCapOf(building);
  const send = gameStore.getState().send;
  return (
    <DrawerPanel>
      <p><Icon name="anchor" /> {t('cove.ships')}: {ships.length} · {t('cove.waterLimit').replace('{count}', `${pirateShipLimit(state, building)}`)}</p>
      <p><Icon name="ticket" /> {t('attraction.seats')}: {seatsOfCove(state, building)}/{cap}</p>
      {seats > cap ? <p className="tourism-help">{t('cove.seatsOverCap').replace('{count}', `${seats - cap}`)}</p> : null}
      {seats === 0 ? <BlockedReason reason={t('error.noSeats')} /> : null}
      {ships.length === 0 ? <BlockedReason reason={t('error.noPirateShip')} /> : null}
      {locked ? <BlockedReason reason={t('error.showLocksCove')} /> : null}
      {ships.map((ship) => (
        <ActionButton key={ship.id} disabled={locked} onClick={() => send({ type: 'SellBoat', id: ship.id })}>
          {t('marina.sell')} · {t(`boat.${ship.family}`)}
        </ActionButton>
      ))}
      {COVE_BOAT_FAMILIES.filter((family) => citizens >= BOATS[family].unlockCitizens).map((family) => (
        <ActionButton key={family} disabled={room <= 0} onClick={() => uiStore.getState().chooseTool({ kind: 'boat', family, marinaId: building.id })}>
          {t('marina.buy')} · {t(`boat.${family}`)} · <UrbsAmount value={BOATS[family].cost} />
        </ActionButton>
      ))}
      {room <= 0 ? <BlockedReason reason={t('error.noWaterForPirateShip')} /> : null}
    </DrawerPanel>
  );
}
