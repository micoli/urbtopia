import { GATHERING, artistById, gatheringPhase, gatheringPhaseEnd, type Building, type GatheringPhase } from '../../core';
import type { GatheringData } from '../../core/engine/state';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { Icon } from '../common/Icon';
import { UrbsAmount } from '../common/UrbsAmount';
import { formatTimeLeft } from '../common/formatDuration';

const PHASES: readonly GatheringPhase[] = ['planned', 'arriving', 'live', 'leaving'];

interface GatheringStatusProps {
  building: Building;
  gathering: GatheringData;
  now: number;
}

export function GatheringStatus({ building, gathering, now }: GatheringStatusProps) {
  const phase = gatheringPhase(gathering, now);
  const reached = PHASES.indexOf(phase);
  const artist = gathering.artist ? artistById(gathering.artist) : undefined;
  return (
    <div className="gathering-status" data-phase={phase}>
      <p className="gathering-status-title">
        <Icon name={gathering.kind === 'show' ? 'music' : 'trophy'} />
        <strong>{artist?.name ?? t(`gathering.kind.${gathering.kind}`)}</strong>
      </p>
      <ol className="gathering-steps">
        {PHASES.map((step, index) => <li key={step} data-state={index < reached ? 'done' : index === reached ? 'current' : 'next'}>{t(`gathering.phase.${step}`)}</li>)}
      </ol>
      <p className="gathering-countdown">{t(`gathering.until.${phase}`).replace('{time}', formatTimeLeft(gatheringPhaseEnd(gathering, phase) - now))}</p>
      <DrawerPanel.LabelValue label={t('show.crowd')} value={Math.round(gathering.crowd)} />
      <DrawerPanel.LabelValue label={t('show.revenue')} value={<UrbsAmount value={gathering.revenue} />} />
      {gathering.kind === 'show' && now < gathering.startsAt ? (
        <ActionButton block onClick={() => gameStore.getState().send({ type: 'CancelShow', buildingId: building.id })}>
          {t('show.cancel').replace('{amount}', `${Math.floor(gathering.cost * GATHERING.cancelRefund)}`)}
        </ActionButton>
      ) : null}
    </div>
  );
}
