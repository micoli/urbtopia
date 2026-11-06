import { useStore } from 'zustand';
import { CROWD_DENSITIES, prefsStore, type Language, type Layout, type PedestrianModel } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { SwitchField } from '../common/SwitchField';
import { SettingRow } from './SettingRow';
import { SettingsSection } from './SettingsSection';

const LANGUAGES: Language[] = ['en', 'fr'];
const LAYOUTS: Layout[] = ['C', 'A', 'B'];
const PEDESTRIAN_MODELS: PedestrianModel[] = ['stickman', 'avatar'];

export function DisplaySettings() {
  const language = useStore(prefsStore, (store) => store.language);
  const layout = useStore(prefsStore, (store) => store.layout);
  const traffic = useStore(prefsStore, (store) => store.traffic);
  const pedestrians = useStore(prefsStore, (store) => store.pedestrians);
  const pedestrianModel = useStore(prefsStore, (store) => store.pedestrianModel);
  const trafficDensity = useStore(prefsStore, (store) => store.trafficDensity);
  const pedestrianDensity = useStore(prefsStore, (store) => store.pedestrianDensity);
  const alwaysDay = useStore(prefsStore, (store) => store.alwaysDay);
  const fineRotation = useStore(prefsStore, (store) => store.fineRotation);
  const showReach = useStore(prefsStore, (store) => store.showReach);
  const showProductionPreview = useStore(prefsStore, (store) => store.showProductionPreview);
  const showTaxBadges = useStore(prefsStore, (store) => store.showTaxBadges);
  const managementTabs = useStore(prefsStore, (store) => store.managementTabs);
  const { setManagementTabs, setLanguage, setLayout, setTraffic, setPedestrians, setPedestrianModel, setTrafficDensity, setPedestrianDensity, setAlwaysDay, setFineRotation, setShowReach, setShowProductionPreview, setShowTaxBadges } = prefsStore.getState();

  return (
    <>
      <SettingsSection title={t('settings.section.interface')} icon="display">
        <SettingRow stacked label={t('prefs.language')}>
          <RadioChipGroup className="prefs-group" label={t('prefs.language')} options={LANGUAGES.map(code => ({ value: code, label: t(`lang.${code}`) }))} value={language} onChange={setLanguage} />
        </SettingRow>
        <SettingRow stacked label={t('prefs.layout')}>
          <RadioChipGroup className="prefs-group" label={t('prefs.layout')} options={LAYOUTS.map(code => ({ value: code, label: t(`prefs.layout.${code}`) }))} value={layout} onChange={setLayout} />
        </SettingRow>
        <SwitchField label={t('prefs.managementTabs')} description={t('prefs.managementTabs.description')} checked={managementTabs} onChange={setManagementTabs} />
      </SettingsSection>
      <SettingsSection title={t('settings.section.map')} icon="map">
        <SwitchField label={t('prefs.traffic')} description={t('prefs.traffic.description')} checked={traffic} onChange={setTraffic} />
        <SettingRow stacked label={t('prefs.trafficDensity')}>
          <RadioChipGroup className="prefs-group" label={t('prefs.trafficDensity')} options={CROWD_DENSITIES.map(density => ({ value: density, label: t(`prefs.density.${density}`) }))} disabled={!traffic} value={trafficDensity} onChange={setTrafficDensity} />
        </SettingRow>
        <SwitchField label={t('prefs.pedestrians')} description={t('prefs.pedestrians.description')} checked={pedestrians} onChange={setPedestrians} />
        <SettingRow stacked label={t('prefs.pedestrianDensity')}>
          <RadioChipGroup className="prefs-group" label={t('prefs.pedestrianDensity')} options={CROWD_DENSITIES.map(density => ({ value: density, label: t(`prefs.density.${density}`) }))} disabled={!pedestrians} value={pedestrianDensity} onChange={setPedestrianDensity} />
        </SettingRow>
        <SettingRow stacked label={t('prefs.pedestrianModel')}>
          <RadioChipGroup className="prefs-group" label={t('prefs.pedestrianModel')} options={PEDESTRIAN_MODELS.map(model => ({ value: model, label: t(`prefs.pedestrianModel.${model}`) }))} disabled={!pedestrians} value={pedestrianModel} onChange={setPedestrianModel} />
        </SettingRow>
        <SwitchField label={t('prefs.alwaysDay')} description={t('prefs.alwaysDay.description')} checked={alwaysDay} onChange={setAlwaysDay} />
        <SwitchField label={t('prefs.fineRotation')} description={t('prefs.fineRotation.description')} checked={fineRotation} onChange={setFineRotation} />
        <SwitchField label={t('prefs.showReach')} checked={showReach} onChange={setShowReach} />
        <SwitchField label={t('prefs.showProductionPreview')} checked={showProductionPreview} onChange={setShowProductionPreview} />
        <SwitchField label={t('prefs.showTaxBadges')} checked={showTaxBadges} onChange={setShowTaxBadges} />
      </SettingsSection>
    </>
  );
}
