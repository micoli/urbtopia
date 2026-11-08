import { useStore } from 'zustand';
import { PICK_MODES, prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { reloadApp } from '../../pwa/reloadApp';
import { useInstallPrompt } from '../../pwa/useInstallPrompt';
import { dialogStore } from '../../store/dialogStore';
import { releaseNotesStore } from '../../store/releaseNotesStore';
import { uiStore } from '../../store/uiStore';
import { ActionButton } from '../common/ActionButton';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { SwitchField } from '../common/SwitchField';
import { BetaSettings } from './BetaSettings';
import { PickOffsetSlider } from './PickOffsetSlider';
import { SettingRow } from './SettingRow';
import { SettingsSection } from './SettingsSection';

function reviewReleaseNotes() {
  uiStore.getState().toggleSettings();
  releaseNotesStore.getState().setReviewing(true);
}

export function AppSettings() {
  const debug = useStore(prefsStore, (store) => store.debug);
  const pickMode = useStore(prefsStore, (store) => store.pickMode);
  const hasReleaseNotes = useStore(releaseNotesStore, (store) => store.releases.some((release) => release.note !== null));
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
        {hasReleaseNotes ? (
          <SettingRow label={t('settings.releaseNotes')} description={t('settings.releaseNotes.description')}>
            <ActionButton size="sm" onClick={reviewReleaseNotes}>{t('settings.releaseNotes.action')}</ActionButton>
          </SettingRow>
        ) : null}
        <SettingRow label={t('settings.version')}>
          <code className="setting-row__value">{__BUILD_ID__}</code>
        </SettingRow>
        <SettingRow label={t('settings.release')}>
          <code className="setting-row__value">{__RELEASE_NAME__}</code>
        </SettingRow>
      </SettingsSection>
      <BetaSettings />
      <SettingsSection title={t('settings.section.advanced')} icon="repair">
        <SettingRow stacked label={t('prefs.pickMode')} description={t('prefs.pickMode.description')}>
          <RadioChipGroup className="prefs-group" label={t('prefs.pickMode')} options={PICK_MODES.map(mode => ({ value: mode, label: t(`prefs.pickMode.${mode}`) }))} value={pickMode} onChange={prefsStore.getState().setPickMode} />
        </SettingRow>
        {pickMode === 'base' ? (
          <div className="setting-indented">
            <small className="setting-text__description">{t('prefs.debugOffset.hint')}</small>
            <PickOffsetSlider axis="x" />
            <PickOffsetSlider axis="y" />
          </div>
        ) : null}
        <SwitchField label={t('prefs.debug')} description={t('prefs.debug.description')} checked={debug} onChange={prefsStore.getState().setDebug} />
      </SettingsSection>
    </>
  );
}
