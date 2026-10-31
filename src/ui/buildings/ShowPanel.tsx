import { GATHERING, inGatheringCooldown, type Building } from '../../core';
import { t } from '../../i18n/t';
import { showDialogStore } from '../../store/showDialogStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { Icon } from '../common/Icon';
import { ProgressBar } from '../common/ProgressBar';
import { formatTimeLeft } from '../common/formatDuration';
import { useGame } from '../common/hooks';
import { GatheringResultNote } from '../tourism/GatheringResultNote';
import { GatheringStatus } from '../tourism/GatheringStatus';

interface ShowPanelProps {
  building: Building;
}

export function ShowPanel({ building }: ShowPanelProps) {
  const now = useGame(store => store.state.lastSeen);
  const gathering = building.attraction?.gathering;
  if (gathering) {
    return (
      <DrawerPanel>
        <div className="show-section">
          <GatheringStatus building={building} gathering={gathering} now={now} />
          <GatheringResultNote building={building} />
        </div>
      </DrawerPanel>
    );
  }
  const cooling = inGatheringCooldown(building, now);
  const left = (building.attraction?.cooldownUntil ?? 0) - now;
  const label = t('show.cooldown').replace('{time}', formatTimeLeft(left));
  return (
    <DrawerPanel>
      <div className="show-section">
        {cooling ? <p className="tourism-label">{label}</p> : null}
        {cooling ? <ProgressBar value={GATHERING.cooldownMs - left} max={GATHERING.cooldownMs} label={label} /> : null}
        <ActionButton variant="primary" block disabled={cooling} onClick={() => showDialogStore.getState().open(building.id)}>
          <Icon name="music" /> {t('show.schedule')}
        </ActionButton>
        <GatheringResultNote building={building} />
      </div>
    </DrawerPanel>
  );
}
