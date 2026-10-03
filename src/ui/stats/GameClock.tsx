import { ECOLOGY } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';

export function GameClock() {
  const now = useGame((store) => store.state.lastSeen + (store.state.timeOffset ?? 0));
  const dayMinutes = 24 * 60;
  const minutes = ((Math.floor(now / (ECOLOGY.hourMs / 60)) % dayMinutes) + dayMinutes) % dayMinutes;
  const hours = Math.floor(minutes / 60);
  const time = `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

  return (
    <time className="game-clock" dateTime={time} title={t('stat.time')} aria-label={`${t('stat.time')}: ${time}`}>
      🕒 {time}
    </time>
  );
}
