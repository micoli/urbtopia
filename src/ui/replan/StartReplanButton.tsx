import { useState } from 'react';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { BlockedReason } from '../common/BlockedReason';
import { useCloud, useGame, useUi } from '../common/hooks';
import { ReplanConfirmDialog } from './ReplanConfirmDialog';
import { startRefusal } from './startRefusal';

export function StartReplanButton() {
  const [asking, setAsking] = useState(false);
  const state = useGame((store) => store.state);
  const saveConflict = useCloud((store) => store.status.kind === 'conflict');
  const statsOpen = useUi((store) => store.statsOpen);
  const toggleStats = useUi((store) => store.toggleStats);
  const settingsOpen = useUi((store) => store.settingsOpen);
  const toggleSettings = useUi((store) => store.toggleSettings);
  const select = useUi((store) => store.select);
  const chooseTool = useUi((store) => store.chooseTool);
  const refusal = startRefusal(state, saveConflict);

  const start = () => {
    setAsking(false);
    select(null);
    if (statsOpen) toggleStats();
    if (settingsOpen) toggleSettings();
    // Closing a window drops the tool in hand: the zone tool comes last.
    chooseTool({ kind: 'replanArea', start: null, horizontalFirst: true });
  };

  return (
    <>
      <ActionButton disabled={refusal !== null || state.replan !== undefined} onClick={() => setAsking(true)}>{t('replan.start')}</ActionButton>
      <BlockedReason reason={refusal ? t(refusal) : null} />
      {asking ? <ReplanConfirmDialog title={t('replan.startTitle')} body={t('replan.startBody')} confirmLabel={t('replan.start')} keepLabel={t('replan.keep')} onConfirm={start} onClose={() => setAsking(false)} /> : null}
    </>
  );
}
