import { BOATS, BOAT_FAMILIES, boatsOfMarina, isBoatOperating, marinaCapacity, readyFish, totalCitizens, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { uiStore } from '../../store/uiStore';
import { useGame } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { UrbsAmount } from '../common/UrbsAmount';

interface MarinaPanelProps {
  building: Building;
}

export function MarinaPanel({ building }: MarinaPanelProps) {
  const state = useGame((store) => store.state);
  const citizens = totalCitizens(state);
  const boats = boatsOfMarina(state, building.id);
  const capacity = marinaCapacity(building);
  const costPerHour = boats.filter((boat) => isBoatOperating(state, boat)).reduce((sum, boat) => sum + BOATS[boat.family].operatingCostPerHour, 0);
  const fish = readyFish(state, building.id);
  const { chooseTool } = uiStore.getState();
  const send = gameStore.getState().send;
  return (
    <DrawerPanel>
      <p>⚓ {t('marina.boats')}: {boats.length}/{capacity}</p>
      {costPerHour > 0 ? <p>{t('marina.cost')}: <UrbsAmount value={costPerHour} />/h</p> : null}
      {boats.some((boat) => boat.family === 'fishing') ? (
        <ActionButton disabled={fish === 0} onClick={() => send({ type: 'CollectCatch', marinaId: building.id })}>
          {t('marina.collect')} · {fish}
        </ActionButton>
      ) : null}
      {boats.length === 0 ? <p>{t('marina.empty')}</p> : null}
      {boats.map((boat) => (
        <p key={boat.id}>
          {t(`boat.${boat.family}`)}
          <ActionButton onClick={() => send({ type: 'SellBoat', id: boat.id })}>{t('marina.sell')}</ActionButton>
        </p>
      ))}
      {BOAT_FAMILIES.filter((family) => citizens >= BOATS[family].unlockCitizens).map((family) => (
        <ActionButton key={family} disabled={boats.length >= capacity} onClick={() => chooseTool({ kind: 'boat', family, marinaId: building.id })}>
          {t('marina.buy')} · {t(`boat.${family}`)} · <UrbsAmount value={BOATS[family].cost} />
        </ActionButton>
      ))}
      <DrawerPanel.Upgrade building={building} />
    </DrawerPanel>
  );
}
