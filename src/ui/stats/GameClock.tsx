import type { MouseEvent } from 'react';
import { ECOLOGY } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';

const QUADRUPLE_CLICK = 4;
const QUICK_SKIP_HOURS = 12;

function skipOnQuadrupleClick(event: MouseEvent) {
  if (event.detail !== QUADRUPLE_CLICK) return;
  gameStore.getState().send({ type: 'SkipTime', hours: QUICK_SKIP_HOURS });
}

export function GameClock() {
  const now = useGame((store) => store.state.lastSeen + (store.state.timeOffset ?? 0));
  const dayMinutes = 24 * 60;
  const minutes = ((Math.floor(now / (ECOLOGY.hourMs / 60)) % dayMinutes) + dayMinutes) % dayMinutes;
  const hours = Math.floor(minutes / 60);
  const time = `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

  return (
    <time onClick={skipOnQuadrupleClick} className="game-clock" dateTime={time} title={t('stat.time')} aria-label={`${t('stat.time')}: ${time}`}>
      🕒 {time}
    </time>
  );
}
