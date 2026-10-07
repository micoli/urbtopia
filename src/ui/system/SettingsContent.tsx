import { useRef, useState, type ChangeEvent } from 'react';
import { exportCurrentCity } from '../../persistence/exportCity';
import { saveSession } from '../../persistence/instance';
import { importCity } from '../../persistence/transfer';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { InlineConfirm } from '../common/InlineConfirm';
import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { gameStore } from '../../store/gameStore';
import { toastStore } from '../../store/toastStore';
import { useUi } from '../common/hooks';
import { reloadApp } from '../../pwa/reloadApp';
import { useInstallPrompt } from '../../pwa/useInstallPrompt';
import { PreferencesContent } from './PreferencesContent';
import { useConfirmKeys } from '../build/useConfirmKeys';
import { PanelHeader } from '../common/PanelHeader';

export function SettingsContent() {
  const toggle = useUi((store) => store.toggleSettings);
  const [confirming, setConfirming] = useState(false);
  const skipTime = (hours: number) => {
    gameStore.getState().send({ type: 'SkipTime', hours });
    toggle();
  };
  const fileInput = useRef<HTMLInputElement>(null);
  const { canInstall, install } = useInstallPrompt();
  const startNewGame = () => {
    saveSession.unlock();
    gameStore.getState().newGame(Date.now());
    setConfirming(false);
    toggle();
  };

  useConfirmKeys({ active: confirming, onConfirm: startNewGame, onCancel: () => setConfirming(false) });

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
      <PanelHeader title={t('settings.title')} onClose={toggle} />
      <ButtonRow align="stretch" spaced className="side-panel-actions">
        {canInstall ? (
          <ActionButton variant="primary" onClick={install}>
            {t('settings.install')}
          </ActionButton>
        ) : null}
          <ActionButton onClick={() => skipTime(12)}>
            {t('settings.skip12')}
          </ActionButton>
        <ActionButton onClick={exportCurrentCity}>
          {t('settings.export')}
        </ActionButton>
        <ActionButton onClick={() => fileInput.current?.click()}>
          {t('settings.import')}
        </ActionButton>
        <ActionButton onClick={() => dialogStore.getState().setCreditsOpen(true)}>
          {t('settings.credits')}
        </ActionButton>
        <ActionButton onClick={() => void reloadApp()}>
          {t('settings.reload')}
        </ActionButton>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onFileChosen} />
        <InlineConfirm
          confirming={confirming}
          triggerLabel={t('settings.newGame')}
          confirmLabel={t('settings.newGame')}
          message={t('settings.newGameConfirm')}
          onRequest={() => setConfirming(true)}
          onCancel={() => setConfirming(false)}
          onConfirm={startNewGame}
        />
      </ButtonRow>
      <PreferencesContent />
      <small className="build-id">
        {t('settings.version')} {__BUILD_ID__}
        <br />
        {t('settings.release')} {__RELEASE_NAME__}
      </small>
    </>
  );
}
