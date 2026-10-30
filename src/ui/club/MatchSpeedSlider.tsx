import { useStore } from 'zustand';
import { MATCH_SPEEDS, prefsStore, type MatchSpeed } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { formatDuration } from '../common/formatDuration';

const speedLabel = (speed: MatchSpeed): string => (speed === 0.25 ? '¼' : speed === 0.5 ? '½' : `${speed}`);

export function MatchSpeedSlider({ durationMs, disabled }: { durationMs: number; disabled: boolean }) {
  const speed = useStore(prefsStore, store => store.matchSpeed);
  const value = t('club.match.speedValue').replace('{speed}', speedLabel(speed)).replace('{duration}', formatDuration(durationMs));
  return (
    <label className="club-speed">
      <span>{t('club.match.speed')}</span>
      <input
        type="range"
        min={0}
        max={MATCH_SPEEDS.length - 1}
        value={MATCH_SPEEDS.indexOf(speed)}
        disabled={disabled}
        aria-valuetext={value}
        onChange={event => prefsStore.getState().setMatchSpeed(MATCH_SPEEDS[Number(event.target.value)]!)}
      />
      <output>{value}</output>
    </label>
  );
}
