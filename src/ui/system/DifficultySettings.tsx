import { difficultyOf } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { SectionHeading } from '../common/SectionHeading';
import { DifficultyChoice } from './DifficultyChoice';

export function DifficultySettings() {
  const difficulty = useGame((store) => difficultyOf(store.state));
  return (
    <section className="prefs">
      <SectionHeading>{t('difficulty.title')}</SectionHeading>
      <DifficultyChoice label={t('difficulty.title')} value={difficulty} onChange={(next) => gameStore.getState().send({ type: 'SetDifficulty', difficulty: next })} />
    </section>
  );
}
