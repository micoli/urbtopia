import { useStore } from 'zustand';
import { t } from '../../i18n/t';
import { prefsStore } from '../../i18n/prefsStore';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';

export function AutoOpenSelectionToggle() {
  const autoOpenSelection = useStore(prefsStore, (store) => store.autoOpenSelection);
  const setAutoOpenSelection = useStore(prefsStore, (store) => store.setAutoOpenSelection);
  return (
    <IconButton
      size="md"
      tone={autoOpenSelection ? 'accent' : 'light'}
      label={t('camera.autoOpenSelection')}
      aria-pressed={autoOpenSelection}
      onClick={() => setAutoOpenSelection(!autoOpenSelection)}
    >
      <Icon name="selectionPanel" />
    </IconButton>
  );
}
