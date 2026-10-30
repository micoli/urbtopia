import { useEffect, useState } from 'react';

const TICK_MS = 260;
const CATCH_UP_STEPS = 12;

// How many of the plays of a Match have been shown on the field: one more every tick, faster when many are waiting, never beyond the plays there are.
export function useEventCursor(total: number): number {
  const [cursor, setCursor] = useState(0);
  const shown = Math.min(cursor, total);
  useEffect(() => {
    if (shown >= total) return;
    const timer = setTimeout(() => setCursor(shown + Math.ceil((total - shown) / CATCH_UP_STEPS)), TICK_MS);
    return () => clearTimeout(timer);
  }, [shown, total]);
  return shown;
}
