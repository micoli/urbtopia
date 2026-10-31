import { useRef } from 'react';
import { sanctionAlertKey, sanctionedHomes, type SanctionedHome } from '../../core';
import { useGame } from './hooks';

export function useSanctionedHomes(): readonly SanctionedHome[] {
  const cache = useRef<{ key: string; homes: readonly SanctionedHome[] } | null>(null);
  return useGame((store) => {
    const key = sanctionAlertKey(store.state);
    if (cache.current?.key !== key) cache.current = { key, homes: sanctionedHomes(store.state) };
    return cache.current.homes;
  });
}
