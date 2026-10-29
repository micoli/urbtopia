import { t } from '../../i18n/t';
import { useBackdropClose } from '../common/useBackdropClose';
import { useUi } from '../common/hooks';
import { useModalFocus } from '../stats/management/useModalFocus';
import { SettingsContent } from './SettingsContent';

function SettingsWindowDialog() {
  const open = useUi((store) => store.settingsOpen);
  const toggle = useUi((store) => store.toggleSettings);
  const dialog = useModalFocus(open, toggle);
  const backdrop = useBackdropClose(toggle);
  return (
    <div className="dialog-backdrop window-backdrop" {...backdrop}>
      <div className="dialog settings-dialog" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t('settings.title')}>
        <SettingsContent />
      </div>
    </div>
  );
}

export function SettingsWindow() {
  const open = useUi((store) => store.settingsOpen);
  return open ? <SettingsWindowDialog /> : null;
}
