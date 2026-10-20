import { difficultyOf, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { SectionHeading } from '../common/SectionHeading';
import { CouncilCircle } from './CouncilCircle';
import { CouncilLegend } from './CouncilLegend';

export function CouncilSection({ state }: { state: GameState }) {
  const politics = state.politics;
  if (!politics) return null;
  const election = politics.lastElection;
  return (
    <section id="politics-council">
      <SectionHeading>{t('politics.council')}</SectionHeading>
      <div className="council-display">
        <CouncilCircle seats={politics.seats} />
        <CouncilLegend seats={politics.seats} />
      </div>
      {election && difficultyOf(state) !== 'easy' && <p>{t('politics.council.lastElection').replace('{approval}', String(Math.round(election.approval)))}</p>}
    </section>
  );
}
