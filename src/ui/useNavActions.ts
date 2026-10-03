import { t } from '../i18n/t';
import { useGame, useUi } from './hooks';
import { guideOf } from './tutorialGuide';

export interface NavAction {
  id: 'build' | 'roads' | 'parcels' | 'market' | 'menu';
  icon: string;
  label: string;
  pressed: boolean;
  disabled: boolean;
  guided: boolean;
  onClick: () => void;
}

export function useNavActions(): NavAction[] {
  const flyout = useUi((store) => store.flyout);
  const tool = useUi((store) => store.tool);
  const marketOpen = useUi((store) => store.marketOpen);
  const menuOpen = useUi((store) => store.menuOpen);
  const openFlyout = useUi((store) => store.openFlyout);
  const chooseTool = useUi((store) => store.chooseTool);
  const toggleMarket = useUi((store) => store.toggleMarket);
  const toggleMenu = useUi((store) => store.toggleMenu);
  const marketUnlocked = useGame((store) => store.state.marketUnlocked);
  const guidedFlyout = guideOf(useGame((store) => store.state.tutorial)).flyout;

  return [
    { id: 'build', icon: '🏗', label: t('dock.build'), pressed: flyout === 'build', disabled: false, guided: guidedFlyout === 'build', onClick: () => openFlyout('build') },
    { id: 'roads', icon: '🛣', label: t('dock.roads'), pressed: flyout === 'roads', disabled: false, guided: guidedFlyout === 'roads', onClick: () => openFlyout('roads') },
    { id: 'parcels', icon: '🗺', label: t('dock.parcels'), pressed: tool?.kind === 'parcel', disabled: false, guided: false, onClick: () => chooseTool({ kind: 'parcel' }) },
    { id: 'market', icon: '💱', label: t('dock.market'), pressed: marketOpen, disabled: !marketUnlocked, guided: false, onClick: toggleMarket },
    { id: 'menu', icon: '⚙', label: t('dock.menu'), pressed: menuOpen, disabled: false, guided: false, onClick: toggleMenu },
  ];
}
