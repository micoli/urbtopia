import { useRef } from 'react';
import { sanctionAlertKey, sanctionedHomes, type SanctionedHome } from '../../core';
import { useGame } from './hooks';

export function useSanctionedHomes(): readonly SanctionedHome[] {
  const state = useGame((store) => store.state);
  const key = sanctionAlertKey(state);
  const cache = useRef<{ key: string; homes: readonly SanctionedHome[] } | null>(null);
  if (cache.current?.key !== key) cache.current = { key, homes: sanctionedHomes(state) };
  return cache.current.homes;
}
