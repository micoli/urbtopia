import { createStore } from 'zustand/vanilla';
import { interiorFamilyOf } from '../core';
import type { Command, GameState } from '../core';

// A feature that ships switched off. A development build can switch it on from the devtools; in production the Player switches it on in the Settings after subscribing to the beta features.
export const FLAGS = {
  clubs: {
    label: 'Gestion des clubs',
    description: 'Clubs de football, de baseball et de basket : effectif, composition, championnat, matchs.',
    commands: ['FoundClub', 'SignPlayer', 'ReleasePlayer', 'SetLineup', 'PlayMatch'] as readonly Command['type'][],
  },
  advisor: {
    label: 'Conseiller',
    description: 'Assistant local (WebLLM) qui explique les Causes de la ville ; téléchargement du modèle sur demande.',
    commands: [] as readonly Command['type'][],
  },
  homeInterior: {
    label: 'Aménagement des logements',
    description: "Ouvre l'intérieur d'un logement : meubles, tableaux, parquet et confort.",
    commands: ['SetHomeParquet'] as readonly Command['type'][],
  },
  // The interiors of the Production buildings and of the Storehouse: the Staff hired in them, and what their Management view offers.
  productionInterior: {
    label: 'Intérieurs de production',
    description: "Ouvre l'intérieur de la minoterie, de la boulangerie, de la laiterie et de l'entrepôt : machines, chaînes et personnel.",
    commands: [] as readonly Command['type'][],
  },
  // The interiors of the School, the Library and the Hospital.
  serviceInterior: {
    label: 'Intérieurs de service',
    description: "Ouvre l'intérieur de l'école, de la bibliothèque et de l'hôpital : mobilier et personnel.",
    commands: [] as readonly Command['type'][],
  },
  // Only the start is gated: a Replan already under way must always be finished or cancelled, whatever the flag says.
  replan: {
    label: 'Réaménagement de la ville',
    description: 'Décroche tout ce qui est posé dans une réserve pour replacer routes, eau et bâtiments ; le jeu se fige pendant ce temps.',
    commands: ['StartReplan'] as readonly Command['type'][],
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

const FAMILY_FLAG = { production: 'productionInterior', service: 'serviceInterior' } as const;

// The flag a command depends on in a given city: the Staff of an interior depend on the flag of the family of the building they are hired in.
export function flagOfCommandIn(command: Command, state: GameState): FlagId | undefined {
  if (command.type !== 'HireInteriorStaff' && command.type !== 'ReleaseInteriorStaff' && command.type !== 'SetInteriorFocus' && command.type !== 'AssignInteriorStaff' && command.type !== 'UnassignInteriorStaff' && command.type !== 'RepairAllInteriorFixtures') return flagOfCommand(command.type);
  const building = state.buildings.find(candidate => candidate.id === command.buildingId);
  const family = building && interiorFamilyOf(building.type);
  return family ? FAMILY_FLAG[family] : undefined;
}

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

export const BETA_KEY = 'urbtopia-beta';

const readBeta = (): boolean => {
  try {
    return localStorage.getItem(BETA_KEY) === 'true';
  } catch {
    return false;
  }
};

const writeBeta = (subscribed: boolean): void => {
  try {
    localStorage.setItem(BETA_KEY, String(subscribed));
  } catch {
    // Storage is unavailable: the subscription holds for this page only.
  }
};

export interface FeatureFlagStore {
  // What is switched on right now: nothing, unless the build allows overrides or the Player subscribed to the beta.
  enabled: FlagValues;
  subscribed: boolean;
  // The Player's choices, kept even while unsubscribed so that subscribing again finds them.
  chosen: FlagValues;
  // Ignored unless the build allows overrides or the Player subscribed to the beta.
  set: (id: FlagId, value: boolean) => void;
  subscribe: (subscribed: boolean) => void;
}

export function createFeatureFlagStore(
  devBuild: boolean,
  read: () => string | null = readStored,
  write: (values: FlagValues) => void = writeStored,
  readSubscribed: () => boolean = readBeta,
  writeSubscribed: (subscribed: boolean) => void = writeBeta,
) {
  const effective = (chosen: FlagValues, subscribed: boolean): FlagValues => (devBuild || subscribed ? chosen : offFlags());
  const chosen = resolveFlags(read(), true);
  const subscribed = readSubscribed();
  return createStore<FeatureFlagStore>((set, get) => ({
    enabled: effective(chosen, subscribed),
    subscribed,
    chosen,
    set: (id, value) => {
      if (!devBuild && !get().subscribed) return;
      const next = { ...get().chosen, [id]: value };
      write(next);
      set({ chosen: next, enabled: effective(next, get().subscribed) });
    },
    subscribe: (value) => {
      writeSubscribed(value);
      set({ subscribed: value, enabled: effective(get().chosen, value) });
    },
  }));
}

export const featureFlagStore = createFeatureFlagStore(import.meta.env.DEV);

export const isBetaSubscribed = (): boolean => featureFlagStore.getState().subscribed;

export const isFlagEnabled = (id: FlagId): boolean => featureFlagStore.getState().enabled[id];
