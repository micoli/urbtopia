import type { CSSProperties } from 'react';
import type { ChallengeSuccess as Success } from '../../store/challengeStore';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { CurrencyText } from '../common/CurrencyText';
import { Icon } from '../common/Icon';

interface ChallengeSuccessProps {
  success: Success;
  onDismiss: () => void;
}

export function ChallengeSuccess({ success, onDismiss }: ChallengeSuccessProps) {
  return (
    <section className="challenge-success" role="status" aria-live="polite">
      <div className="challenge-success-confetti" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <i key={index} style={{ '--x': `${(index - 7.5) * 22}px`, '--delay': `${(index % 4) * 70}ms`, '--spin': `${index % 2 === 0 ? 240 : -240}deg` } as CSSProperties} />
        ))}
      </div>
      <span className="challenge-success-trophy" aria-hidden="true"><Icon name={success.rewardKind === 'medal' ? 'medal' : 'trophy'} /></span>
      <strong>{t('challenge.success')}</strong>
      <p><CurrencyText text={success.rewardKind === 'urbs' ? t('challenge.successUrbs').replace('{amount}', String(success.urbs)) : t('challenge.successMedal')} /></p>
      <ActionButton onClick={onDismiss}>{t('challenge.successDismiss')}</ActionButton>
    </section>
  );
}
