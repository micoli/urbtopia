import { VENUE_TUTORIAL_TYPES, stepsOfVenueTutorial } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { TutorialBannerFrame } from './TutorialBannerFrame';

export function VenueTutorialBanner() {
  const venueTutorials = useGame((store) => store.state.venueTutorials);
  const type = VENUE_TUTORIAL_TYPES.find((candidate) => venueTutorials?.[candidate]);
  const step = type === undefined ? null : venueTutorials?.[type];
  if (type === undefined || !step) return null;

  const steps = stepsOfVenueTutorial(type);
  return (
    <TutorialBannerFrame
      title={t(`venueTutorial.title.${type}`)}
      counter={`${steps.indexOf(step) + 1}/${steps.length}`}
      text={t(`venueTutorial.${type}.${step}` as MessageKey)}
      skipLabel={t('venueTutorial.skip')}
      skipConfirmLabel={t('tutorial.skipConfirm')}
      onSkip={() => gameStore.getState().send({ type: 'SkipVenueTutorial', venueType: type })}
    />
  );
}
