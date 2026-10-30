import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { MatchSpeedSlider } from './MatchSpeedSlider';
import type { useLiveMatch } from './useLiveMatch';

// Play, pause, skip, record and the speed: the controls every sport's live Match shares.
export function ClubMatchBar({ live, durationMs, finished = live.finished }: { live: ReturnType<typeof useLiveMatch>; durationMs: number; finished?: boolean }) {
  return (
    <>
      <div className="club-actions">
        <ActionButton variant="primary" disabled={finished} onClick={live.toggle}>{live.playing ? t('club.match.pause') : t('club.match.play')}</ActionButton>
        <ActionButton variant="default" disabled={finished} onClick={live.skip}>{t('club.match.skip')}</ActionButton>
        <ActionButton variant="default" disabled={live.recorded || live.decisions.length === 0} onClick={live.record}>{t('club.match.record')}</ActionButton>
      </div>
      <MatchSpeedSlider durationMs={durationMs} disabled={finished} />
      {live.recorded ? <p className="note note--muted">{t('club.match.recorded')}</p> : null}
    </>
  );
}
