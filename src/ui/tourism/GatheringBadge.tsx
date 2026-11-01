import { memo, useRef } from 'react';
import type { GatheringPhase } from '../../core';
import type { GatheringData } from '../../core/engine/state';
import { t } from '../../i18n/t';
import { uiStore } from '../../store/uiStore';
import { Icon } from '../common/Icon';
import { useProjectedPosition } from '../common/useProjectedPosition';

const BADGE_HEIGHT = 4.8;

export interface GatheringBadgeSpec {
  id: number;
  worldX: number;
  worldZ: number;
  kind: GatheringData['kind'];
  phase: GatheringPhase;
  time: string;
}

export const GatheringBadge = memo(function GatheringBadge({ id, worldX, worldZ, kind, phase, time }: GatheringBadgeSpec) {
  const ref = useRef<HTMLButtonElement>(null);
  useProjectedPosition(ref, worldX, BADGE_HEIGHT, worldZ, 'above');
  return (
    <button ref={ref} type="button" className="gathering-badge" data-phase={phase} onClick={() => uiStore.getState().select(id)}>
      <Icon name={kind === 'show' ? 'music' : 'trophy'} />
      <span>{t(`gathering.phase.${phase}`)}</span>
      <small>{time}</small>
    </button>
  );
});
