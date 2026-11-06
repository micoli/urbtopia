import { t } from '../../i18n/t';

interface MatchTimeSliderProps {
  step: number;
  lastStep: number;
  onSeek: (step: number) => void;
}

export function MatchTimeSlider({ step, lastStep, onSeek }: MatchTimeSliderProps) {
  const value = t('club.match.minute').replace('{minute}', `${step}`);
  return (
    <label className="club-speed">
      <span>{t('club.match.seek')}</span>
      <input type="range" min={0} max={lastStep} value={step} aria-valuetext={value} onChange={event => onSeek(Number(event.target.value))} />
      <output>{value}</output>
    </label>
  );
}
