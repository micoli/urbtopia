import { CHALLENGE_REWARD_MULTIPLIER } from '../../core';
import { t } from '../../i18n/t';

export function ChallengesPage() {
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.challenges.title')}</h3>
      <p>{t('codex.challenges.intro')}</p>
      <h4>{t('codex.challenges.kinds')}</h4>
      <ul>
        <li>{t('codex.challenges.daily')}</li>
        <li>{t('codex.challenges.event')}</li>
      </ul>
      <h4>{t('codex.challenges.rules')}</h4>
      <ul>
        <li>{t('codex.challenges.one')}</li>
        <li>{t('codex.challenges.abandon')}</li>
        <li>{t('codex.challenges.stock')}</li>
        <li>{t('codex.challenges.reward').replace('{multiplier}', String(CHALLENGE_REWARD_MULTIPLIER))}</li>
        <li>{t('codex.challenges.timeSkip')}</li>
        <li>{t('codex.challenges.unlock')}</li>
      </ul>
    </>
  );
}
