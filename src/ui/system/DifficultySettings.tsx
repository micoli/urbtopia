import { difficultyOf } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { DifficultyChoice } from './DifficultyChoice';
import { SettingsSection } from './SettingsSection';

export function DifficultySettings() {
  const difficulty = useGame((store) => difficultyOf(store.state));
  return (
    <SettingsSection title={t('difficulty.title')} icon="trend">
      <div className="settings-section__body">
        <DifficultyChoice label={t('difficulty.title')} value={difficulty} onChange={(next) => gameStore.getState().send({ type: 'SetDifficulty', difficulty: next })} />
      </div>
    </SettingsSection>
  );
}
