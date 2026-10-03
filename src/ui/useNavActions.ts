import { useEffect, useState } from 'react';
import { t } from '../i18n/t';
import { useGame, useUi, useReadOnly } from './hooks';
import { guideOf } from './tutorialGuide';

export interface NavAction {
  id: 'build' | 'roads' | 'parcels' | 'market' | 'stats' | 'codex' | 'menu' | 'undo';
  icon: string;
  image?: string;
  label: string;
  pressed: boolean;
  disabled: boolean;
  guided: boolean;
  onClick: () => void;
}

export function useNavActions(): NavAction[] {
  const [touch, setTouch] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)');
    const update = () => setTouch(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const undo = useGame((store) => store.undo);
  const canUndo = useGame((store) => store.deletionUndo !== null);
  const readOnly = useReadOnly();
  const flyout = useUi((store) => store.flyout);
  const tool = useUi((store) => store.tool);
  const marketOpen = useUi((store) => store.marketOpen);
  const menuOpen = useUi((store) => store.menuOpen);
  const statsOpen = useUi(store => store.statsOpen);
  const toggleStats = useUi(store => store.toggleStats);
  const codexOpen = useUi(store => store.codexOpen);
  const openCodex = useUi(store => store.openCodex);
  const openFlyout = useUi((store) => store.openFlyout);
  const chooseTool = useUi((store) => store.chooseTool);
  const toggleMarket = useUi((store) => store.toggleMarket);
  const toggleMenu = useUi((store) => store.toggleMenu);
  const marketUnlocked = useGame((store) => store.state.marketUnlocked);
  const guidedFlyout = guideOf(useGame((store) => store.state.tutorial)).flyout;

  const actions: NavAction[] = [
    { id: 'build', icon: '🏗', image: 'bulldozer.png', label: t('dock.build'), pressed: flyout === 'build', disabled: false, guided: guidedFlyout === 'build', onClick: () => openFlyout('build') },
    { id: 'roads', icon: '🛣', image: 'roads.png', label: t('dock.roads'), pressed: flyout === 'roads', disabled: false, guided: guidedFlyout === 'roads', onClick: () => openFlyout('roads') },
    { id: 'parcels', icon: '🗺', image: 'map.png', label: t('dock.parcels'), pressed: tool?.kind === 'parcel', disabled: false, guided: false, onClick: () => chooseTool({ kind: 'parcel' }) },
    { id: 'market', icon: '💱', image: 'market.png', label: t('dock.market'), pressed: marketOpen, disabled: !marketUnlocked, guided: false, onClick: toggleMarket },
    { id: 'stats', icon: '📊', image: 'town-management.png', label: t('eco.title'), pressed: statsOpen, disabled: false, guided: false, onClick: toggleStats },
    { id: 'codex', icon: '📖', image: 'codex.png', label: t('codex.title'), pressed: codexOpen, disabled: false, guided: false, onClick: () => openCodex() },
    { id: 'menu', icon: '⚙', image: 'settings.png', label: t('dock.menu'), pressed: menuOpen, disabled: false, guided: false, onClick: toggleMenu },
  ];
  if (touch) actions.push({ id: 'undo', icon: '↶', label: t('action.undo'), pressed: false, disabled: !canUndo || readOnly, guided: false, onClick: undo });
  return actions;
}
