import { useStore } from 'zustand';
import { FLAG_IDS, featureFlagStore } from '../../featureFlags/featureFlags';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { SwitchField } from '../common/SwitchField';
import { SettingsSection } from './SettingsSection';

export function BetaSettings() {
  const subscribed = useStore(featureFlagStore, (store) => store.subscribed);
  const chosen = useStore(featureFlagStore, (store) => store.chosen);
  const { subscribe, set } = featureFlagStore.getState();
  return (
    <SettingsSection title={t('beta.section')} icon="sparkles">
      <SwitchField label={t('beta.subscribe')} description={t('beta.subscribe.description')} checked={subscribed} onChange={subscribe} />
      {subscribed && FLAG_IDS.map((id) => (
        <SwitchField
          key={id}
          label={t(`beta.flag.${id}` as MessageKey)}
          description={t(`beta.flag.${id}.description` as MessageKey)}
          checked={chosen[id]}
          onChange={(value) => set(id, value)}
        />
      ))}
    </SettingsSection>
  );
}
