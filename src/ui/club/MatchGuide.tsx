import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';

export type MatchPhase = 'ready' | 'playing' | 'paused' | 'finished';
export type MatchSport = 'football' | 'baseball' | 'basketball';

interface MatchGuideProps {
  phase: MatchPhase;
  sport: MatchSport;
  recorded: boolean;
}

const STEPS = ['watch', 'decide', 'record'] as const;

export function MatchGuide({ phase, sport, recorded }: MatchGuideProps) {
  const status = recorded ? 'recorded' : phase;
  return (
    <section className="club-guide" aria-label={t('club.guide.title')}>
      <h3 className="club-guide__title">{t('club.guide.title')}</h3>
      <ol className="club-guide__steps">
        {STEPS.map(step => <li key={step}>{t(`club.guide.${step}.${step === 'decide' ? sport : 'any'}` as MessageKey)}</li>)}
      </ol>
      <p className="club-guide__status" role="status">{t(`club.guide.now.${status}` as MessageKey)}</p>
    </section>
  );
}
