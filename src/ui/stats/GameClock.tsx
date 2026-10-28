import type { MouseEvent } from 'react';
import { cycleTimeOf } from '../../core';
import { cycleClockOf } from './cycleClock';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { Icon } from '../common/Icon';

const QUADRUPLE_CLICK = 4;
const QUICK_SKIP_HOURS = 12;

function skipOnQuadrupleClick(event: MouseEvent) {
  if (event.detail !== QUADRUPLE_CLICK) return;
  gameStore.getState().send({ type: 'SkipTime', hours: QUICK_SKIP_HOURS });
}

export function GameClock() {
  const cycleTime = useGame((store) => cycleTimeOf(store.state, store.state.lastSeen));
  const { time, icon } = cycleClockOf(cycleTime);

  return (
    <time onClick={skipOnQuadrupleClick} className="game-clock" dateTime={time} title={t('stat.time')} aria-label={`${t('stat.time')}: ${time}`}>
      <Icon name={icon} /> {time}
    </time>
  );
}
