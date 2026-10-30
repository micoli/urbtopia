import { useRef, type ChangeEvent } from 'react';
import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { exportCurrentCity } from '../../persistence/exportCity';
import { liveCityLifecycle } from '../../persistence/liveCityLifecycle';
import { toastStore } from '../../store/toastStore';
import { ActionButton } from '../common/ActionButton';
import { SwitchField } from '../common/SwitchField';
import { CloudSaveSection } from './CloudSaveSection';
import { SettingRow } from './SettingRow';
import { SettingsSection } from './SettingsSection';

export function SavesSettings() {
  const signInPrompt = useStore(prefsStore, (store) => store.signInPrompt);
  const fileInput = useRef<HTMLInputElement>(null);
  const onFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const result = liveCityLifecycle.importFile(await file.text());
    if (!result.ok) toastStore.getState().show(`import.${result.reason}`);
  };

  return (
    <>
      <CloudSaveSection />
      <SettingsSection title={t('settings.section.files')} icon="disk">
        <SettingRow label={t('settings.export')} description={t('settings.export.description')}>
          <ActionButton size="sm" onClick={exportCurrentCity}>{t('settings.export.action')}</ActionButton>
        </SettingRow>
        <SettingRow label={t('settings.import')} description={t('settings.import.description')}>
          <ActionButton size="sm" onClick={() => fileInput.current?.click()}>{t('settings.import.action')}</ActionButton>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onFileChosen} />
        </SettingRow>
      </SettingsSection>
      <SettingsSection title={t('settings.section.reminders')} icon="bell">
        <SwitchField label={t('prefs.signInPrompt')} description={t('prefs.signInPrompt.description')} checked={signInPrompt} onChange={prefsStore.getState().setSignInPrompt} />
      </SettingsSection>
    </>
  );
}
