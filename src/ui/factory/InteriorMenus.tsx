import { useStore } from 'zustand';
import { hasServiceInterior, type Building } from '../../core';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { Dock } from '../layout/Dock';
import type { NavAction } from '../layout/useNavActions';
import { VenueFlyout } from '../venue/VenueFlyout';
import { VenuePlacementHint } from '../venue/VenuePlacementHint';
import { VenueSidePanel } from '../venue/VenueSidePanel';
import { InteriorStats } from './InteriorStats';
import { ServiceStats } from './ServiceStats';

interface InteriorMenusProps {
  factory: Building;
}

// The menus of a Factory interior: the build menu, the selected Fixture, and the way back to the city. An interior has no Takings or events.
export function InteriorMenus({ factory }: InteriorMenusProps) {
  const panel = useStore(venueStore, store => store.panel);
  const { togglePanel, close } = venueStore.getState();
  const actions: NavAction[] = [
    { id: 'build', icon: 'build', label: t('dock.build'), image: 'bulldozer.png', pressed: panel === 'build', disabled: false, guided: false, onClick: () => togglePanel('build') },
    { id: 'staff', icon: 'citizens', label: t('venue.staff'), pressed: panel === 'staff', disabled: false, guided: false, onClick: () => togglePanel('staff') },
    { id: 'back', icon: 'undo', label: t('venue.menu.back'), pressed: false, disabled: false, guided: false, onClick: close },
  ];
  return (
    <>
      <VenuePlacementHint />
      <Dock actions={actions} header={hasServiceInterior(factory) ? <ServiceStats building={factory} /> : <InteriorStats factory={factory} />} bottomId="back" />
      <VenueFlyout venue={factory} />
      <VenueSidePanel venue={factory} />
    </>
  );
}
