import { useState } from 'react';
import { advance } from '../../core';
import { downloadText } from '../../persistence/download';
import { saveSession, saveStore } from '../../persistence/instance';
import { hasBackup as hasStoredBackup, restoreBackup } from '../../persistence/transfer';
import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { gameStore } from '../../store/gameStore';
import { useDialogs } from '../common/hooks';

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
        <div className="dialog-column">
          <button type="button" disabled={!hasBackup} onClick={restore}>
            {t('recovery.restore')}
          </button>
          <button type="button" onClick={() => downloadText('urbtopia-raw-save.json', recovery.raw)}>
            {t('recovery.exportRaw')}
          </button>
          {confirmingNewGame ? (
            <>
              <p>{t('menu.newGameConfirm')}</p>
              <button type="button" onClick={() => setConfirmingNewGame(false)}>
                {t('sale.no')}
              </button>
              <button type="button" className="dialog-danger" onClick={startNewGame}>
                {t('recovery.newGame')}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmingNewGame(true)}>
              {t('recovery.newGame')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
