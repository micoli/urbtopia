import { useEffect, useState } from 'react';

const CATCH_UP_STEPS = 12;

// How many of the plays of a Match have been shown on the field: one more every tick while the Match runs, faster when many are waiting, never beyond the plays there are.
export function useEventCursor(total: number, tickMs: number, running: boolean): number {
  const [cursor, setCursor] = useState(0);
  const shown = Math.min(cursor, total);
  useEffect(() => {
    if (!running || shown >= total) return;
    const timer = setTimeout(() => setCursor(shown + Math.ceil((total - shown) / CATCH_UP_STEPS)), tickMs);
    return () => clearTimeout(timer);
  }, [shown, total, tickMs, running]);
  return shown;
}
