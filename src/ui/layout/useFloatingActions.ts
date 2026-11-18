import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';

interface FloatingActions {
  move: boolean;
  rotate: boolean;
  repair: boolean;
  sell: boolean;
}

// Which actions of the floating menu are on: each display setting counts only while the master switch is on.
export function useFloatingActions(): FloatingActions {
  const enabled = useStore(prefsStore, store => store.floatingMenu);
  const move = useStore(prefsStore, store => store.floatingMove);
  const rotate = useStore(prefsStore, store => store.floatingRotate);
  const repair = useStore(prefsStore, store => store.floatingRepair);
  const sell = useStore(prefsStore, store => store.floatingSell);
  return { move: enabled && move, rotate: enabled && rotate, repair: enabled && repair, sell: enabled && sell };
}
