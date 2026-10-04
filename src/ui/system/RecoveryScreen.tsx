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
import { ButtonRow } from '../common/ButtonRow';

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
    <div className="dialog-backdrop recovery" role="alertdialog" aria-modal="true">
      <div className="dialog">
        <h2>{t('recovery.title')}</h2>
        <p>{t(`recovery.reason.${recovery.reason}`)}</p>
        {noBackup || !hasBackup ? <p className="stat-tight">{t('recovery.noBackup')}</p> : null}
        <ButtonRow align="start" column>
          <ActionButton disabled={!hasBackup} onClick={restore}>
            {t('recovery.restore')}
          </ActionButton>
          <ActionButton onClick={() => downloadText('urbtopia-raw-save.json', recovery.raw)}>
            {t('recovery.exportRaw')}
          </ActionButton>
          {confirmingNewGame ? (
            <>
              <p>{t('menu.newGameConfirm')}</p>
              <ActionButton onClick={() => setConfirmingNewGame(false)}>
                {t('sale.no')}
              </ActionButton>
              <ActionButton variant="danger" onClick={startNewGame}>
                {t('recovery.newGame')}
              </ActionButton>
            </>
          ) : (
            <ActionButton onClick={() => setConfirmingNewGame(true)}>
              {t('recovery.newGame')}
            </ActionButton>
          )}
        </ButtonRow>
      </div>
    </div>
  );
}
