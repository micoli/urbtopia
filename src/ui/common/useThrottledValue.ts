import { startTransition, useEffect, useState } from 'react';

// Polls `read` every `intervalMs`, in a transition, without subscribing: a heavy panel never re-renders on each game tick.
export function useThrottledValue<T>(read: () => T, intervalMs: number): T {
  const [snapshot, setSnapshot] = useState(read);
  useEffect(() => {
    const id = setInterval(() => startTransition(() => setSnapshot(read())), intervalMs);
    return () => clearInterval(id);
  }, [read, intervalMs]);
  return snapshot;
}
