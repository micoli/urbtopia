import { energyStats } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { Note } from '../common/Note';

export function PowerShortageNote() {
  const state = useGame((store) => store.state);
  if ((state.adaptationUntil ?? 0) > state.lastSeen) return null;
  const { economicRatio } = energyStats(state);
  if (economicRatio >= 1) return null;
  if (economicRatio <= 0) return <Note>{t('power.halted')}</Note>;
  return <Note>{t('power.slowed')} ({Math.round(economicRatio * 100)} %)</Note>;
}
