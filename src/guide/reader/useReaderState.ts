import { useMemo } from 'react';
import { useStore } from 'zustand';
import type { GameState } from '../../core';
import { readerSettingsStore } from './readerSettingsStore';
import { readerStateOf } from './readerState';

export function useReaderState(): GameState {
  const difficulty = useStore(readerSettingsStore, store => store.difficulty);
  const citizens = useStore(readerSettingsStore, store => store.citizens);
  return useMemo(() => readerStateOf({ difficulty, citizens }), [difficulty, citizens]);
}
