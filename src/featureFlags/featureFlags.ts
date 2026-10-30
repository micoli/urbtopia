import { createStore } from 'zustand/vanilla';
import type { Command } from '../core';

// A feature that ships switched off. In production it stays off; a development build can switch it on from the devtools.
export const FLAGS = {
  clubs: {
    label: 'Gestion des clubs',
    description: 'Clubs de football et de baseball : effectif, composition, championnat, matchs.',
    commands: ['FoundClub', 'SignPlayer', 'ReleasePlayer', 'SetLineup', 'PlayMatch'] as readonly Command['type'][],
  },
} as const;

export type FlagId = keyof typeof FLAGS;

export const FLAG_IDS = Object.keys(FLAGS) as FlagId[];

export const FLAGS_KEY = 'urbtopia-flags';

export type FlagValues = Record<FlagId, boolean>;

export const offFlags = (): FlagValues => Object.fromEntries(FLAG_IDS.map(id => [id, false])) as FlagValues;

// What is stored is a JSON object of booleans; anything else, or an unknown flag, is ignored. Overrides only count when the build allows them.
export function resolveFlags(raw: string | null, overridable: boolean): FlagValues {
  const values = offFlags();
  if (!overridable || raw === null) return values;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const id of FLAG_IDS) if (typeof parsed[id] === 'boolean') values[id] = parsed[id];
  } catch {
    return values;
  }
  return values;
}

export const flagOfCommand = (type: Command['type']): FlagId | undefined => FLAG_IDS.find(id => FLAGS[id].commands.includes(type));

const readStored = (): string | null => {
  try {
    return localStorage.getItem(FLAGS_KEY);
  } catch {
    return null;
  }
};

const writeStored = (values: FlagValues): void => {
  try {
    localStorage.setItem(FLAGS_KEY, JSON.stringify(values));
  } catch {
    // Storage is unavailable: the switch holds for this page only.
  }
};

export interface FeatureFlagStore {
  enabled: FlagValues;
  // Ignored in production, where every flag stays off.
  set: (id: FlagId, value: boolean) => void;
}

export function createFeatureFlagStore(overridable: boolean, read: () => string | null = readStored, write: (values: FlagValues) => void = writeStored) {
  return createStore<FeatureFlagStore>((set, get) => ({
    enabled: resolveFlags(read(), overridable),
    set: (id, value) => {
      if (!overridable) return;
      const enabled = { ...get().enabled, [id]: value };
      write(enabled);
      set({ enabled });
    },
  }));
}

export const featureFlagStore = createFeatureFlagStore(import.meta.env.DEV);

export const isFlagEnabled = (id: FlagId): boolean => featureFlagStore.getState().enabled[id];
