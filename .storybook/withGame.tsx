import type { Decorator } from '@storybook/react-vite';
import { cloudStore, type CloudStore } from '../src/store/cloudStore';
import { dialogStore, type DialogStore } from '../src/store/dialogStore';
import { gameStore } from '../src/store/gameStore';
import { readOnlyStore } from '../src/store/readOnlyStore';
import { socialStore, type SocialStore } from '../src/store/socialStore';
import { toastStore, type ToastStore } from '../src/store/toastStore';
import { casinoStore } from '../src/store/casinoStore';
import { venueStore } from '../src/store/venueStore';
import { uiStore, type UiStore } from '../src/store/uiStore';
import { prefsStore, type Prefs } from '../src/i18n/prefsStore';
import type { BuildingType } from '../src/core';
import { GAME_FIXTURES, type GameFixtureName } from './fixtures';

export const DEFAULT_GAME_FIXTURE: GameFixtureName = 'starter';

export interface StoreOverrides {
  ui?: Partial<UiStore>;
  dialog?: Partial<DialogStore>;
  cloud?: Partial<CloudStore>;
  social?: Partial<SocialStore>;
  toast?: Partial<ToastStore>;
  readOnly?: boolean;
  prefs?: Partial<Prefs>;
  selectBuilding?: BuildingType;
  setup?: () => void;
}

function selectBuildingOfType(type: BuildingType | undefined) {
  if (!type) return;
  const building = gameStore.getState().state.buildings.find((candidate) => candidate.type === type);
  if (!building) throw new Error(`The game fixture has no "${type}" building`);
  uiStore.getState().select(building.id);
}

function resetStores(fixture: GameFixtureName, overrides: StoreOverrides) {
  uiStore.setState(uiStore.getInitialState(), true);
  dialogStore.setState(dialogStore.getInitialState(), true);
  venueStore.setState(venueStore.getInitialState(), true);
  casinoStore.setState(casinoStore.getInitialState(), true);
  cloudStore.setState(cloudStore.getInitialState(), true);
  socialStore.setState(socialStore.getInitialState(), true);
  toastStore.setState(toastStore.getInitialState(), true);
  readOnlyStore.setState(readOnlyStore.getInitialState(), true);
  prefsStore.setState({ language: 'en', ...overrides.prefs });
  gameStore.getState().replaceState(GAME_FIXTURES[fixture]());
  uiStore.setState({ ...overrides.ui });
  dialogStore.setState({ ...overrides.dialog });
  cloudStore.setState({ ...overrides.cloud });
  socialStore.setState({ ...overrides.social });
  toastStore.setState({ ...overrides.toast });
  readOnlyStore.setState({ readOnly: overrides.readOnly ?? false });
  selectBuildingOfType(overrides.selectBuilding);
  overrides.setup?.();
}

export const withGame: Decorator = (Story, { parameters }) => {
  resetStores(parameters.game ?? DEFAULT_GAME_FIXTURE, parameters.stores ?? {});
  return <Story />;
};
