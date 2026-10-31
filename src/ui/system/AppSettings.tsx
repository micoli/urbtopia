import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { reloadApp } from '../../pwa/reloadApp';
import { useInstallPrompt } from '../../pwa/useInstallPrompt';
import { dialogStore } from '../../store/dialogStore';
import { ActionButton } from '../common/ActionButton';
import { SwitchField } from '../common/SwitchField';
import { SettingRow } from './SettingRow';
import { SettingsSection } from './SettingsSection';

export function AppSettings() {
  const debug = useStore(prefsStore, (store) => store.debug);
  const { canInstall, install } = useInstallPrompt();

  return (
    <>
      <SettingsSection title={t('settings.section.application')} icon="device">
        {canInstall ? (
          <SettingRow label={t('settings.install')} description={t('settings.install.description')}>
            <ActionButton size="sm" variant="primary" onClick={install}>{t('settings.install.action')}</ActionButton>
          </SettingRow>
        ) : null}
        <SettingRow label={t('settings.reload')} description={t('settings.reload.description')}>
          <ActionButton size="sm" onClick={() => void reloadApp()}>{t('settings.reload')}</ActionButton>
        </SettingRow>
      </SettingsSection>
      <SettingsSection title={t('settings.section.about')} icon="info">
        <SettingRow label={t('settings.credits')} description={t('settings.credits.description')}>
          <ActionButton size="sm" onClick={() => dialogStore.getState().setCreditsOpen(true)}>{t('settings.credits.action')}</ActionButton>
        </SettingRow>
        <SettingRow label={t('settings.version')}>
          <code className="setting-row__value">{__BUILD_ID__}</code>
        </SettingRow>
        <SettingRow label={t('settings.release')}>
          <code className="setting-row__value">{__RELEASE_NAME__}</code>
        </SettingRow>
      </SettingsSection>
      <SettingsSection title={t('settings.section.advanced')} icon="repair">
        <SwitchField label={t('prefs.debug')} description={t('prefs.debug.description')} checked={debug} onChange={prefsStore.getState().setDebug} />
      </SettingsSection>
    </>
  );
}
