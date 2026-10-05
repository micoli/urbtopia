import { useState } from 'react';
import { advance } from '../../core';
import { downloadText } from '../../persistence/download';
import { saveSession, saveStore } from '../../persistence/instance';
import { hasBackup as hasStoredBackup, restoreBackup } from '../../persistence/transfer';
import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { gameStore } from '../../store/gameStore';
import { useDialogs } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';
import { InlineConfirm } from '../common/InlineConfirm';
import { Note } from '../common/Note';

export function RecoveryScreen() {
  const recovery = useDialogs((store) => store.recovery);
  const [confirmingNewGame, setConfirmingNewGame] = useState(false);
  const [noBackup, setNoBackup] = useState(false);
  if (!recovery) return null;

  const hasBackup = hasStoredBackup(saveStore);
  const close = () => dialogStore.getState().setRecovery(null);

  const restore = () => {
    const result = restoreBackup(saveStore, saveSession);
    if (!result.ok) return setNoBackup(true);
    gameStore.getState().replaceState(advance(result.state, Date.now()).state);
    close();
  };

  const startNewGame = () => {
    saveSession.unlock();
    gameStore.getState().newGame(Date.now());
    close();
  };

  return (
    <Dialog role="alertdialog" className="recovery">
      <Dialog.Title>{t('recovery.title')}</Dialog.Title>
      <Dialog.Body>
        <p>{t(`recovery.reason.${recovery.reason}`)}</p>
        {noBackup || !hasBackup ? <Note>{t('recovery.noBackup')}</Note> : null}
      </Dialog.Body>
      <Dialog.Actions align="start" column>
        <ActionButton disabled={!hasBackup} onClick={restore}>{t('recovery.restore')}</ActionButton>
        <ActionButton onClick={() => downloadText('urbtopia-raw-save.json', recovery.raw)}>{t('recovery.exportRaw')}</ActionButton>
        <InlineConfirm
          confirming={confirmingNewGame}
          triggerLabel={t('recovery.newGame')}
          confirmLabel={t('recovery.newGame')}
          message={t('settings.newGameConfirm')}
          onRequest={() => setConfirmingNewGame(true)}
          onCancel={() => setConfirmingNewGame(false)}
          onConfirm={startNewGame}
        />
      </Dialog.Actions>
    </Dialog>
  );
}
