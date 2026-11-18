import { memo } from 'react';
import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { SwitchField } from '../common/SwitchField';
import { SettingsSection } from './SettingsSection';

// Memoized: it takes no props, so the other display settings re-rendering the section around it do not re-render it.
export const FloatingMenuSettings = memo(function FloatingMenuSettings() {
  const floatingMenu = useStore(prefsStore, (store) => store.floatingMenu);
  const floatingMove = useStore(prefsStore, (store) => store.floatingMove);
  const floatingRotate = useStore(prefsStore, (store) => store.floatingRotate);
  const floatingRepair = useStore(prefsStore, (store) => store.floatingRepair);
  const floatingSell = useStore(prefsStore, (store) => store.floatingSell);
  const floatingSellBuilding = useStore(prefsStore, (store) => store.floatingSellBuilding);
  const floatingCollect = useStore(prefsStore, (store) => store.floatingCollect);
  const floatingInterior = useStore(prefsStore, (store) => store.floatingInterior);
  const { setFloatingMenu, setFloatingMove, setFloatingRotate, setFloatingRepair, setFloatingSell, setFloatingSellBuilding, setFloatingCollect, setFloatingInterior } = prefsStore.getState();
  return (
    <SettingsSection title={t('settings.section.floatingMenu')} icon="selectionPanel">
      <SwitchField label={t('prefs.floatingMenu')} description={t('prefs.floatingMenu.description')} checked={floatingMenu} onChange={setFloatingMenu} />
      <SwitchField label={t('prefs.floatingMove')} checked={floatingMove} disabled={!floatingMenu} onChange={setFloatingMove} />
      <SwitchField label={t('prefs.floatingRotate')} checked={floatingRotate} disabled={!floatingMenu} onChange={setFloatingRotate} />
      <SwitchField label={t('prefs.floatingRepair')} checked={floatingRepair} disabled={!floatingMenu} onChange={setFloatingRepair} />
      <SwitchField label={t('prefs.floatingSellBuilding')} checked={floatingSellBuilding} disabled={!floatingMenu} onChange={setFloatingSellBuilding} />
      <SwitchField label={t('prefs.floatingSell')} checked={floatingSell} disabled={!floatingMenu} onChange={setFloatingSell} />
      <SwitchField label={t('prefs.floatingCollect')} checked={floatingCollect} disabled={!floatingMenu} onChange={setFloatingCollect} />
      <SwitchField label={t('prefs.floatingInterior')} checked={floatingInterior} disabled={!floatingMenu} onChange={setFloatingInterior} />
    </SettingsSection>
  );
});
