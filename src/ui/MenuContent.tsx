import { useRef, useState, type ChangeEvent } from 'react';
import { exportCurrentCity } from '../persistence/exportCity';
import { saveSession } from '../persistence/instance';
import { importCity } from '../persistence/transfer';
import { t } from '../i18n/t';
import { dialogStore } from '../store/dialogStore';
import { gameStore } from '../store/gameStore';
import { toastStore } from '../store/toastStore';
import { useUi } from './hooks';
import { useInstallPrompt } from '../pwa/useInstallPrompt';
import { PreferencesContent } from './PreferencesContent';

export function MenuContent() {
  const toggle = useUi((store) => store.toggleMenu);
  const [confirming, setConfirming] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { canInstall, install } = useInstallPrompt();
  const startNewGame = () => {
    saveSession.unlock();
    gameStore.getState().newGame(Date.now());
    setConfirming(false);
    toggle();
  };

  const onFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const result = importCity(await file.text(), saveSession, Date.now());
    if (!result.ok) return toastStore.getState().show(`import.${result.reason}`);
    dialogStore.getState().setPendingImport(result.state);
    toggle();
  };

  return (
    <>
      <header className="side-panel-header">
        <h2>{t('menu.title')}</h2>
        <button type="button" className="panel-close" aria-label={t('panel.close')} onClick={toggle}>
          ✗
        </button>
      </header>
      <div className="side-panel-actions">
        {canInstall ? (
          <button type="button" className="dialog-primary" onClick={install}>
            {t('menu.install')}
          </button>
        ) : null}
        <button type="button" onClick={exportCurrentCity}>
          {t('menu.export')}
        </button>
        <button type="button" onClick={() => fileInput.current?.click()}>
          {t('menu.import')}
        </button>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onFileChosen} />
        {confirming ? (
          <>
            <p>{t('menu.newGameConfirm')}</p>
            <button type="button" onClick={() => setConfirming(false)}>
              {t('sale.no')}
            </button>
            <button type="button" className="dialog-danger" onClick={startNewGame}>
              {t('menu.newGame')}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)}>
            {t('menu.newGame')}
          </button>
        )}
      </div>
      <PreferencesContent />
      <small className="build-id">
        {t('menu.version')} {__BUILD_ID__}
      </small>
    </>
  );
}
