import { useEffect } from 'react';
import { useStore } from 'zustand';
import { PICK_DOT_MS, pickDotStore } from '../../store/pickDotStore';

// A small blinking dot on the point a click picked, for one second.
export function PickDotMarker() {
  const dot = useStore(pickDotStore, (store) => store.dot);
  useEffect(() => {
    if (!dot) return;
    const timer = window.setTimeout(() => pickDotStore.getState().clear(), PICK_DOT_MS);
    return () => window.clearTimeout(timer);
  }, [dot]);
  if (!dot) return null;
  return <span key={dot.id} className="pick-dot" style={{ left: dot.x, top: dot.y }} aria-hidden="true" />;
}
