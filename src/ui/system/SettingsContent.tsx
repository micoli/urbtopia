import { useRef, type ChangeEvent } from 'react';
import { exportCurrentCity } from '../../persistence/exportCity';
import { liveCityLifecycle } from '../../persistence/liveCityLifecycle';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { gameStore } from '../../store/gameStore';
import { toastStore } from '../../store/toastStore';
import { useGame, useUi } from '../common/hooks';
import { reloadApp } from '../../pwa/reloadApp';
import { useInstallPrompt } from '../../pwa/useInstallPrompt';
import { CloudSaveSection } from './CloudSaveSection';
import { PreferencesContent } from './PreferencesContent';
import { DifficultySettings } from './DifficultySettings';
import { PanelHeader } from '../common/PanelHeader';

export function SettingsContent() {
  const toggle = useUi((store) => store.toggleSettings);
  const seed = useGame((store) => store.state.seed);
  const challengeRunning = useGame((store) => store.state.challenge !== undefined);
  const skipTime = (hours: number) => {
    gameStore.getState().send({ type: 'SkipTime', hours });
    toggle();
  };
  const fileInput = useRef<HTMLInputElement>(null);
  const { canInstall, install } = useInstallPrompt();
  const onFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const result = liveCityLifecycle.importFile(await file.text());
    if (!result.ok) toastStore.getState().show(`import.${result.reason}`);
  };

  return (
    <>
      <PanelHeader title={t('settings.title')} onClose={toggle} />
      <p className="settings-seed">
        {t('settings.seed')} <code>{seed}</code>
      </p>
      <ButtonRow align="stretch" spaced className="side-panel-actions">
        {canInstall ? (
          <ActionButton variant="primary" onClick={install}>
            {t('settings.install')}
          </ActionButton>
        ) : null}
          <ActionButton onClick={() => skipTime(6)} disabled={challengeRunning} title={challengeRunning ? t('error.challengeInProgress') : undefined}>
            +6
          </ActionButton>
          <ActionButton onClick={() => skipTime(12)} disabled={challengeRunning} title={challengeRunning ? t('error.challengeInProgress') : undefined}>
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
      </ButtonRow>
      <DifficultySettings />
      <PreferencesContent />
      <hr/>
      <CloudSaveSection />
      <small className="build-id">
        {t('settings.version')} {__BUILD_ID__}
        <br />
        {t('settings.release')} {__RELEASE_NAME__}
      </small>
    </>
  );
}
