import { t } from '../i18n/t';
import { useGame, useUi } from './hooks';
import { CityStats } from './CityStats';
import { UrbsStat } from './UrbsStat';

export function Dock() {
  const flyout = useUi((store) => store.flyout);
  const openFlyout = useUi((store) => store.openFlyout);
  const tool = useUi((store) => store.tool);
  const chooseTool = useUi((store) => store.chooseTool);
  const marketOpen = useUi((store) => store.marketOpen);
  const toggleMarket = useUi((store) => store.toggleMarket);
  const toggleMenu = useUi((store) => store.toggleMenu);
  const marketUnlocked = useGame((store) => store.state.marketUnlocked);
  return (
    <nav className="dock">
      <UrbsStat />
      <CityStats />
      <button type="button" className="dock-button" aria-pressed={flyout === 'build'} onClick={() => openFlyout('build')}>
        🏗
        <span>{t('dock.build')}</span>
      </button>
      <button type="button" className="dock-button" aria-pressed={flyout === 'roads'} onClick={() => openFlyout('roads')}>
        🛣
        <span>{t('dock.roads')}</span>
      </button>
      <button type="button" className="dock-button" aria-pressed={tool?.kind === 'parcel'} onClick={() => chooseTool({ kind: 'parcel' })}>
        🗺
        <span>{t('dock.parcels')}</span>
      </button>
      <button type="button" className="dock-button" aria-pressed={marketOpen} disabled={!marketUnlocked} onClick={toggleMarket}>
        💱
        <span>{t('dock.market')}</span>
      </button>
      <button type="button" className="dock-button" onClick={toggleMenu}>
        ⚙
        <span>{t('dock.menu')}</span>
      </button>
    </nav>
  );
}
