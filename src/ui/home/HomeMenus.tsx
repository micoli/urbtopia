import { useStore } from 'zustand';
import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { openBuildingCodexLazily } from '../codex/openCodexLazily';
import { venueStore } from '../../store/venueStore';
import { Dock } from '../layout/Dock';
import type { NavAction } from '../layout/useNavActions';
import { VenueFlyout } from '../venue/VenueFlyout';
import { VenuePlacementHint } from '../venue/VenuePlacementHint';
import { VenueSidePanel } from '../venue/VenueSidePanel';
import { HomeStats } from './HomeStats';

interface HomeMenusProps {
  home: Building;
}

// The menus of a Home interior: the build menu, the selected Fixture and the way back to the city. A Home has no Staff, Takings or events.
export function HomeMenus({ home }: HomeMenusProps) {
  const panel = useStore(venueStore, store => store.panel);
  const { togglePanel, close } = venueStore.getState();
  const actions: NavAction[] = [
    { id: 'build', icon: 'build', label: t('dock.build'), pressed: panel === 'build', disabled: false, guided: false, onClick: () => togglePanel('build') },
    { id: 'parquet', icon: 'sparkles', label: t('home.interior.parquet'), pressed: panel === 'parquet', disabled: false, guided: false, onClick: () => togglePanel('parquet') },
    { id: 'codex', icon: 'book', image: 'codex.png', label: t('codex.title'), pressed: false, disabled: false, guided: false, onClick: () => void openBuildingCodexLazily(home.type) },
    { id: 'back', icon: 'undo', label: t('venue.menu.back'), pressed: false, disabled: false, guided: false, onClick: close },
  ];
  return (
    <>
      <VenuePlacementHint />
      <Dock actions={actions} header={<HomeStats home={home} />} bottomId="back" />
      <VenueFlyout venue={home} />
      <VenueSidePanel venue={home} />
    </>
  );
}
