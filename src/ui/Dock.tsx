import { t } from '../i18n/t';
import { useUi } from './hooks';
import { UrbsStat } from './UrbsStat';

export function Dock() {
  const flyout = useUi((store) => store.flyout);
  const openFlyout = useUi((store) => store.openFlyout);
  return (
    <nav className="dock">
      <UrbsStat />
      <button type="button" className="dock-button" aria-pressed={flyout === 'build'} onClick={() => openFlyout('build')}>
        🏗
        <span>{t('dock.build')}</span>
      </button>
      <button type="button" className="dock-button" aria-pressed={flyout === 'roads'} onClick={() => openFlyout('roads')}>
        🛣
        <span>{t('dock.roads')}</span>
      </button>
    </nav>
  );
}
