import { useState } from 'react';
import { GATHERING, TAKINGS, inGatheringCooldown, previewGathering, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { NumberStepper } from '../common/NumberStepper';
import { UrbsAmount } from '../common/UrbsAmount';
import { useGame } from '../common/hooks';

interface ShowPanelProps {
  building: Building;
}

export function ShowPanel({ building }: ShowPanelProps) {
  const state = useGame(store => store.state);
  const [startsInHours, setStartsInHours] = useState(1);
  const gathering = building.attraction?.gathering;
  if (gathering) return <p className="note note--muted">{t('show.scheduled').replace('{crowd}', `${Math.round(gathering.crowd)}`)}</p>;
  if (inGatheringCooldown(building, state.lastSeen)) {
    const hours = Math.ceil(((building.attraction?.cooldownUntil ?? 0) - state.lastSeen) / TAKINGS.hourMs);
    return <p className="note note--muted">{t('show.cooldown').replace('{hours}', `${hours}`)}</p>;
  }
  const preview = previewGathering(state, building);
  return (
    <DrawerPanel>
      <DrawerPanel.LabelValue label={t('show.crowd')} value={Math.round(preview.crowd)} />
      <NumberStepper label={t('show.startsIn')} value={startsInHours} min={0} max={GATHERING.maxDelayHours} onChange={setStartsInHours} />
      <ActionButton variant="primary" block disabled={state.urbs < preview.cost} onClick={() => gameStore.getState().send({ type: 'ScheduleShow', buildingId: building.id, startsInHours })}>
        {t('show.schedule')} · <UrbsAmount value={preview.cost} />
      </ActionButton>
    </DrawerPanel>
  );
}
