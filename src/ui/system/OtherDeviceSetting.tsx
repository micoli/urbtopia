import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { useCloud, useUi } from '../common/hooks';
import { SettingRow } from './SettingRow';

export function OtherDeviceSetting() {
  const enabled = useCloud((store) => store.enabled);
  const hasEmail = useCloud((store) => Boolean(store.account?.email));
  const setSettingsTab = useUi((store) => store.setSettingsTab);
  if (!enabled || hasEmail) return null;

  return (
    <SettingRow label={t('settings.otherDevice')} description={t('settings.otherDevice.description')}>
      <ActionButton size="sm" onClick={() => setSettingsTab('saves')}>{t('settings.otherDevice.action')}</ActionButton>
    </SettingRow>
  );
}
