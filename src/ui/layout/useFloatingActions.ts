import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';

interface FloatingActions {
  move: boolean;
  rotate: boolean;
  repair: boolean;
  sellItem: boolean;
  sellBuilding: boolean;
  collect: boolean;
  interior: boolean;
}

// Which actions of the floating menu are on: each display setting counts only while the master switch is on.
export function useFloatingActions(): FloatingActions {
  const enabled = useStore(prefsStore, store => store.floatingMenu);
  const move = useStore(prefsStore, store => store.floatingMove);
  const rotate = useStore(prefsStore, store => store.floatingRotate);
  const repair = useStore(prefsStore, store => store.floatingRepair);
  const sellItem = useStore(prefsStore, store => store.floatingSell);
  const sellBuilding = useStore(prefsStore, store => store.floatingSellBuilding);
  const collect = useStore(prefsStore, store => store.floatingCollect);
  const interior = useStore(prefsStore, store => store.floatingInterior);
  return { move: enabled && move, rotate: enabled && rotate, repair: enabled && repair, sellItem: enabled && sellItem, sellBuilding: enabled && sellBuilding, collect: enabled && collect, interior: enabled && interior };
}
