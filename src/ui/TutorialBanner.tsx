import { useState } from 'react';
import { TUTORIAL_STEPS, tutorialSkipMs } from '../core';
import { t } from '../i18n/t';
import { gameStore } from '../store/gameStore';
import { useGame } from './hooks';

export function TutorialBanner() {
  const state = useGame((store) => store.state);
  const [confirming, setConfirming] = useState(false);
  const step = state.tutorial;
  if (step === null) return null;

  const send = gameStore.getState().send;
  const canSkipTime = tutorialSkipMs(state, state.lastSeen) !== null;
  const skipTutorial = () => {
    setConfirming(false);
    send({ type: 'SkipTutorial' });
  };

  return (
    <aside className="tutorial-banner">
      <header>
        <strong>{t('tutorial.title')}</strong>
        <span>
          {TUTORIAL_STEPS.indexOf(step) + 1}/{TUTORIAL_STEPS.length}
        </span>
      </header>
      <p>{t(`tutorial.${step}`)}</p>
      <div className="tutorial-actions">
        {canSkipTime ? (
          <button type="button" className="dialog-primary" onClick={() => send({ type: 'SkipTutorialStep' })}>
            {t('tutorial.timeSkip')}
          </button>
        ) : null}
        {confirming ? (
          <>
            <button type="button" onClick={() => setConfirming(false)}>
              {t('sale.no')}
            </button>
            <button type="button" className="dialog-danger" onClick={skipTutorial}>
              {t('tutorial.skipConfirm')}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)}>
            {t('tutorial.skip')}
          </button>
        )}
      </div>
    </aside>
  );
}
