import { useState } from 'react';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { replanSummaryStore } from '../../store/replanSummaryStore';
import { uiStore } from '../../store/uiStore';
import { ActionButton } from '../common/ActionButton';
import { isReplanSummaryEmpty, replanSummary } from '../../core';
import { useGame } from '../common/hooks';
import { ReplanConfirmDialog } from './ReplanConfirmDialog';
import { StashGroupButton } from './StashGroupButton';
import { stashGroups } from './stashGroups';

export function ReplanPanel() {
  const state = useGame((store) => store.state);
  const [cancelling, setCancelling] = useState(false);
  if (!state.replan) return null;
  const groups = stashGroups(state);

  const finish = () => {
    uiStore.getState().cancelTool();
    const summary = replanSummary(state);
    gameStore.getState().send({ type: 'FinishReplan' });
    if (!gameStore.getState().state.replan && !isReplanSummaryEmpty(summary)) replanSummaryStore.getState().show(summary);
  };
  const cancel = () => {
    setCancelling(false);
    uiStore.getState().cancelTool();
    gameStore.getState().send({ type: 'CancelReplan' });
  };

  return (
    <aside className="replan-panel" aria-label={t('replan.title')}>
      <h2>{t('replan.title')}</h2>
      <h3>{t('replan.stash')}</h3>
      {groups.length === 0 ? <p>{t('replan.stashEmpty')}</p> : <ul className="stash-groups">{groups.map((group) => <StashGroupButton key={group.id} group={group} />)}</ul>}
      <div className="replan-actions">
        <ActionButton onClick={() => setCancelling(true)}>{t('replan.cancel')}</ActionButton>
        <ActionButton variant="primary" disabled={groups.length > 0} onClick={finish}>{t('replan.finish')}</ActionButton>
      </div>
      {cancelling ? <ReplanConfirmDialog title={t('replan.cancelTitle')} body={t('replan.cancelBody')} confirmLabel={t('replan.cancel')} keepLabel={t('replan.keep')} onConfirm={cancel} onClose={() => setCancelling(false)} /> : null}
    </aside>
  );
}
