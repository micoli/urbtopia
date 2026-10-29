import { TUTORIAL_STEPS, tutorialSkipMs } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame, useUi } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { TutorialBannerFrame } from './TutorialBannerFrame';
import { VenueTutorialBanner } from './VenueTutorialBanner';

export function TutorialBanner() {
  const state = useGame((store) => store.state);
  const settingsOpen = useUi(store => store.settingsOpen);
  const codexOpen = useUi(store => store.codexOpen);
  const step = state.tutorial;
  if (settingsOpen || codexOpen) return null;
  if (step === null) return <VenueTutorialBanner />;

  const send = gameStore.getState().send;
  const canSkipTime = tutorialSkipMs(state, state.lastSeen) !== null;
  const challengeRunning = state.challenge !== undefined;

  return (
    <TutorialBannerFrame
      title={t('tutorial.title')}
      counter={`${TUTORIAL_STEPS.indexOf(step) + 1}/${TUTORIAL_STEPS.length}`}
      text={t(`tutorial.${step}`)}
      skipLabel={t('tutorial.skip')}
      skipConfirmLabel={t('tutorial.skipConfirm')}
      onSkip={() => send({ type: 'SkipTutorial' })}
      actions={
        canSkipTime ? (
          <ActionButton size="xs" variant="primary" onClick={() => send({ type: 'SkipTutorialStep' })} disabled={challengeRunning} title={challengeRunning ? t('error.challengeInProgress') : undefined}>
            {t('tutorial.timeSkip')}
          </ActionButton>
        ) : undefined
      }
    />
  );
}
