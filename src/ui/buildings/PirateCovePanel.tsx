import { BOATS, isCoveLocked, pirateShipLimit, pirateShipRoom, pirateShipsOfCove, seatCapOf, seatsOfCove, seatsOfStands, standsOfCove, type Building } from '../../core';
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
  const room = pirateShipRoom(state, building);
  const locked = isCoveLocked(state, building.id);
  const seats = standsOfCove(state, building.id).reduce((total, stands) => total + seatsOfStands(stands.type), 0);
  const cap = seatCapOf(building);
  const send = gameStore.getState().send;
  return (
    <DrawerPanel>
      <p><Icon name="anchor" /> {t('boat.pirate')}: {ships.length} · {t('cove.waterLimit').replace('{count}', `${pirateShipLimit(state, building)}`)}</p>
      <p><Icon name="ticket" /> {t('attraction.seats')}: {seatsOfCove(state, building)}/{cap}</p>
      {seats > cap ? <p className="tourism-help">{t('cove.seatsOverCap').replace('{count}', `${seats - cap}`)}</p> : null}
      {seats === 0 ? <BlockedReason reason={t('error.noSeats')} /> : null}
      {ships.length === 0 ? <BlockedReason reason={t('error.noPirateShip')} /> : null}
      {locked ? <BlockedReason reason={t('error.showLocksCove')} /> : null}
      {ships.map((ship) => (
        <ActionButton key={ship.id} disabled={locked} onClick={() => send({ type: 'SellBoat', id: ship.id })}>
          {t('marina.sell')} · {t('boat.pirate')}
        </ActionButton>
      ))}
      <ActionButton disabled={room <= 0} onClick={() => uiStore.getState().chooseTool({ kind: 'boat', family: 'pirate', marinaId: building.id })}>
        {t('marina.buy')} · {t('boat.pirate')} · <UrbsAmount value={BOATS.pirate.cost} />
      </ActionButton>
      {room <= 0 ? <BlockedReason reason={t('error.noWaterForPirateShip')} /> : null}
    </DrawerPanel>
  );
}
