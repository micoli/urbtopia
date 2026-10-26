import { cloudEnabled } from '../persistence/cloud/cloudConfig';
import { SAVE_KEY } from '../persistence/saveStore';
import { readRegistry } from '../persistence/cities';
import { openCityId, rawSaveStore, saveStore } from '../persistence/instance';
import { gameStore } from '../store/gameStore';
import { readOnlyStore } from '../store/readOnlyStore';
import { showcaseStore } from '../store/showcaseStore';
import { socialStore } from '../store/socialStore';
import { uiStore } from '../store/uiStore';
import { loadShowcaseClient } from './loadShowcaseClient';
import { showcasePublishHandle } from './publishHandle';
import { ShowcaseError } from './types';
import { ShowcasePublisher } from './showcasePublisher';
import { VisitController } from './visitController';

let selectionBeforeVisit: number | null | undefined;

// The visited city has other buildings: the selection and the tool of the player's own city are put aside.
function presentVisit(): void {
  const ui = uiStore.getState();
  if (selectionBeforeVisit === undefined) selectionBeforeVisit = ui.selectedBuildingId;
  ui.cancelTool();
  uiStore.setState({ selectedBuildingId: null });
  if (ui.socialOpen) ui.toggleSocial();
}

function restoreSelection(): void {
  if (selectionBeforeVisit === undefined) return;
  uiStore.setState({ selectedBuildingId: selectionBeforeVisit });
  selectionBeforeVisit = undefined;
}

export function installShowcase(): () => void {
  if (!cloudEnabled) return () => {};

  let disposed = false;
  let stopWatching = () => {};

  void loadShowcaseClient(openCityId()).then((client) => {
    if (!client || disposed) return;
    const store = showcaseStore.getState();
    const publisher = new ShowcasePublisher({
      client,
      isMember: () => socialStore.getState().profile !== null,
      readLocal: () => saveStore.get(SAVE_KEY),
      cityName: () => readRegistry(rawSaveStore)?.cities.find((city) => city.id === openCityId())?.name ?? '',
      onStatus: (status) => showcaseStore.getState().setStatus(status),
    });
    const visits = new VisitController({
      client,
      game: {
        state: () => gameStore.getState().state,
        replaceState: (state, change) => gameStore.getState().replaceState(state, change),
        tick: (now) => gameStore.getState().tick(now),
      },
      readOnly: { get: () => readOnlyStore.getState().readOnly, set: (readOnly) => readOnlyStore.getState().set(readOnly) },
      now: Date.now,
      onState: (visit) => showcaseStore.getState().setVisit(visit),
    });
    store.enable({
      refreshHallOfFame: async () => {
        showcaseStore.getState().setHallOfFame('loading');
        try {
          showcaseStore.getState().setHallOfFame('ready', await client.hallOfFame());
        } catch (error) {
          showcaseStore.getState().setHallOfFame(error instanceof ShowcaseError && error.kind === 'offline' ? 'offline' : 'error');
        }
      },
      acknowledgeNotice: () => publisher.acknowledgeNotice().catch(() => {}),
      setOptOut: (optedOut) => publisher.setOptOut(optedOut).catch(() => {}),
      visit: async (userId, cityId) => {
        await visits.visit(userId, cityId);
        if (showcaseStore.getState().visit.kind === 'visiting') presentVisit();
      },
      leaveVisit: () => {
        visits.leave();
        restoreSelection();
      },
    });
    showcasePublishHandle.current = (envelope) => void publisher.publish(envelope);

    const followProfile = () => {
      if (socialStore.getState().profile === null) return;
      if (publisher.status === null) void publisher.loadStatus();
    };
    followProfile();
    const stopSocial = socialStore.subscribe(followProfile);
    const stopReadOnly = readOnlyStore.subscribe((state) => {
      if (state.readOnly || !visits.visiting) return;
      visits.abandon();
      restoreSelection();
    });
    stopWatching = () => {
      stopSocial();
      stopReadOnly();
      showcasePublishHandle.current = () => {};
    };
  });

  return () => {
    disposed = true;
    stopWatching();
  };
}
