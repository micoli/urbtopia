import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { MatchSpeedSlider } from './MatchSpeedSlider';
import { MatchTimeSlider } from './MatchTimeSlider';
import type { useLiveMatch } from './useLiveMatch';

interface ClubMatchPlaybackProps {
  live: ReturnType<typeof useLiveMatch>;
  durationMs: number;
  finished?: boolean;
  // Gives a slider to go back to, or ahead to, a given step of the Match.
  lastStep?: number;
}

export function ClubMatchPlayback({ live, durationMs, finished = live.finished, lastStep }: ClubMatchPlaybackProps) {
  return (
    <>
      <div className="club-transport">
        <ActionButton variant="primary" disabled={finished} onClick={live.toggle}>{live.playing ? t('club.match.pause') : t('club.match.play')}</ActionButton>
        {lastStep !== undefined && <MatchTimeSlider step={Math.min(live.step, lastStep)} lastStep={lastStep} onSeek={live.seek} />}
      </div>
      <div className="club-actions">
        <ActionButton variant="default" disabled={finished} onClick={live.skip}>{t('club.match.skip')}</ActionButton>
      </div>
      <MatchSpeedSlider durationMs={durationMs} disabled={finished} />
      {lastStep !== undefined && <p className="note note--muted">{t('club.match.seekHint')}</p>}
    </>
  );
}
