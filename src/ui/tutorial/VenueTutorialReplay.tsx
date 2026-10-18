import { canReplayVenueTutorial, hasVenueTutorial, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';

interface VenueTutorialReplayProps {
  building: Building;
}

export function VenueTutorialReplay({ building }: VenueTutorialReplayProps) {
  const state = useGame((store) => store.state);
  const type = building.type;
  if (!hasVenueTutorial(type) || state.venueTutorials?.[type] || !canReplayVenueTutorial(state, type)) return null;
  return (
    <ActionButton block onClick={() => gameStore.getState().send({ type: 'ReplayVenueTutorial', venueType: type })}>
      {t('venueTutorial.replay')}
    </ActionButton>
  );
}
