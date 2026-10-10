import { FLEET_VEHICLES, TRANSIT, totalCitizens } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { gameStore } from '../../../../store/gameStore.ts';
import { ActionButton } from '../../../common/ActionButton.tsx';
import { UrbsAmount } from '../../../common/UrbsAmount.tsx';
import { useGame } from '../../../common/hooks.ts';

const KINDS = FLEET_VEHICLES.map(({ id }) => id);

export function FleetPurchase() {
  const state = useGame(s => s.state);
  const citizens = totalCitizens(state);
  return <div className="transit-actions">
    {KINDS.map(kind => <ActionButton
      key={kind}
      disabled={state.urbs < TRANSIT[kind].price || citizens < TRANSIT[TRANSIT[kind].mode].unlock}
      onClick={() => gameStore.getState().send({ type: 'BuyTransitVehicle', kind })}
    >
      {t('transit.buy')} {t(`transit.${kind}`)} · <UrbsAmount value={TRANSIT[kind].price} />
    </ActionButton>)}
  </div>;
}
