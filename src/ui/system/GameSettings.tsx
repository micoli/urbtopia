import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { useGame, useUi } from '../common/hooks';
import { SwitchField } from '../common/SwitchField';
import { DifficultySettings } from './DifficultySettings';
import { SettingRow } from './SettingRow';
import { SettingsSection } from './SettingsSection';

const TIME_SKIPS = [1, 6, 12] as const;

export function GameSettings() {
  const toggle = useUi((store) => store.toggleSettings);
  const seed = useGame((store) => store.state.seed);
  const challengeRunning = useGame((store) => store.state.challenge !== undefined);
  const confirmSale = useStore(prefsStore, (store) => store.confirmSale);
  const skipTime = (hours: number) => {
    gameStore.getState().send({ type: 'SkipTime', hours });
    toggle();
  };

  return (
    <>
      <SettingsSection title={t('settings.section.city')} icon="map">
        <SettingRow label={t('settings.seed')} description={t('settings.seed.description')}>
          <code className="setting-row__value">{seed}</code>
        </SettingRow>
      </SettingsSection>
      <DifficultySettings />
      <SettingsSection title={t('settings.section.time')} icon="clock">
        <SettingRow label={t('settings.skip.label')} description={t('settings.skip.description')}>
          {TIME_SKIPS.map((hours) => (
            <ActionButton
              key={hours}
              size="sm"
              onClick={() => skipTime(hours)}
              disabled={challengeRunning}
              title={challengeRunning ? t('error.challengeInProgress') : undefined}
            >
              {t(`settings.skip${hours}`)}
            </ActionButton>
          ))}
        </SettingRow>
      </SettingsSection>
      <SettingsSection title={t('settings.section.safeguards')} icon="shield">
        <SwitchField label={t('prefs.confirmSale')} checked={confirmSale} onChange={prefsStore.getState().setConfirmSale} />
      </SettingsSection>
    </>
  );
}
