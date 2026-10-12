import { totalCitizens, solarPanelsCost, solarPanelsUnlockCitizens, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { useGame } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

interface SolarPanelsRowProps {
  building: Building;
}

export function SolarPanelsRow({ building }: SolarPanelsRowProps) {
  const state = useGame(s => s.state);
  const cost = solarPanelsCost(building);
  const unlock = solarPanelsUnlockCitizens(building.type);
  const locked = totalCitizens(state) < unlock;
  return <>
    <ActionButton block disabled={building.solar || locked || state.urbs < cost} onClick={() => gameStore.getState().send({ type: 'EquipSolarPanels', buildingId: building.id })}>
      {t('eco.retrofit')} · {building.solar ? t('eco.installed') : <UrbsAmount value={cost} />}
    </ActionButton>
    {locked && !building.solar && <p>{t('eco.retrofit')} · {t('eco.locked')}: {unlock}</p>}
  </>;
}
