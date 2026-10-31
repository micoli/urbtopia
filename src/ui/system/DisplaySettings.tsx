import { useStore } from 'zustand';
import { prefsStore, type Language, type Layout } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { SwitchField } from '../common/SwitchField';
import { SettingRow } from './SettingRow';
import { SettingsSection } from './SettingsSection';

const LANGUAGES: Language[] = ['en', 'fr'];
const LAYOUTS: Layout[] = ['C', 'A', 'B'];

export function DisplaySettings() {
  const language = useStore(prefsStore, (store) => store.language);
  const layout = useStore(prefsStore, (store) => store.layout);
  const traffic = useStore(prefsStore, (store) => store.traffic);
  const alwaysDay = useStore(prefsStore, (store) => store.alwaysDay);
  const showReach = useStore(prefsStore, (store) => store.showReach);
  const showProductionPreview = useStore(prefsStore, (store) => store.showProductionPreview);
  const showTaxBadges = useStore(prefsStore, (store) => store.showTaxBadges);
  const { setLanguage, setLayout, setTraffic, setAlwaysDay, setShowReach, setShowProductionPreview, setShowTaxBadges } = prefsStore.getState();

  return (
    <>
      <SettingsSection title={t('settings.section.interface')} icon="display">
        <SettingRow stacked label={t('prefs.language')}>
          <RadioChipGroup className="prefs-group" label={t('prefs.language')} options={LANGUAGES.map(code => ({ value: code, label: t(`lang.${code}`) }))} value={language} onChange={setLanguage} />
        </SettingRow>
        <SettingRow stacked label={t('prefs.layout')}>
          <RadioChipGroup className="prefs-group" label={t('prefs.layout')} options={LAYOUTS.map(code => ({ value: code, label: t(`prefs.layout.${code}`) }))} value={layout} onChange={setLayout} />
        </SettingRow>
      </SettingsSection>
      <SettingsSection title={t('settings.section.map')} icon="map">
        <SwitchField label={t('prefs.traffic')} description={t('prefs.traffic.description')} checked={traffic} onChange={setTraffic} />
        <SwitchField label={t('prefs.alwaysDay')} description={t('prefs.alwaysDay.description')} checked={alwaysDay} onChange={setAlwaysDay} />
        <SwitchField label={t('prefs.showReach')} checked={showReach} onChange={setShowReach} />
        <SwitchField label={t('prefs.showProductionPreview')} checked={showProductionPreview} onChange={setShowProductionPreview} />
        <SwitchField label={t('prefs.showTaxBadges')} checked={showTaxBadges} onChange={setShowTaxBadges} />
      </SettingsSection>
    </>
  );
}
