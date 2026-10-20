import type { GameState } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { SectionHeading } from '../common/SectionHeading';
import { ObjectiveRow } from './ObjectiveRow';

export function PoliticsObjectivesSection({ state }: { state: GameState }) {
  const politics = state.politics;
  if (!politics) return null;
  const due = Math.floor(politics.grantsDue);
  return (
    <section id="politics-objectives">
      <SectionHeading>{t('politics.objectives')}</SectionHeading>
      {politics.objectives.length === 0 && <p>{t('politics.objective.none')}</p>}
      <ul className="politics-list">
        {politics.objectives.map(active => <ObjectiveRow key={active.id} state={state} active={active} />)}
      </ul>
      {due > 0 && <ActionButton variant="primary" onClick={() => gameStore.getState().send({ type: 'ClaimGrants' })}>{t('politics.claim').replace('{amount}', String(due))}</ActionButton>}
    </section>
  );
}
