import { cloudEnabled } from '../persistence/cloud/cloudConfig';
import { saveNowHandle } from '../persistence/saveNow';
import { SocialPoller } from '../social/socialPoller';
import { challengeStore } from '../store/challengeStore';
import { cloudStore } from '../store/cloudStore';
import { gameStore } from '../store/gameStore';
import { createLiveGamePort } from '../store/liveGamePort';
import { liveCommandGateway } from '../store/liveCommandGateway';
import { readOnlyStore } from '../store/readOnlyStore';
import { socialStore } from '../store/socialStore';
import { uiStore } from '../store/uiStore';
import { createChallengeActions, type ChallengeGame } from './challengeActions';
import { loadChallengeClient } from './loadChallengeClient';

export function installChallenges(): () => void {
  if (!cloudEnabled) return () => {};

  let disposed = false;
  let stopWatching = () => {};

  void loadChallengeClient().then((client) => {
    if (!client || disposed) return;
    const game: ChallengeGame = {
      ...createLiveGamePort({ store: gameStore, gateway: liveCommandGateway, persist: () => saveNowHandle.current() }),
      canPlay: () => !readOnlyStore.getState().readOnly,
    };
    const actions = createChallengeActions(client, challengeStore.getState(), () => challengeStore.getState(), game);
    challengeStore.getState().enable(actions);
    const signedIn = () => (cloudStore.getState().account?.email ?? null) !== null && socialStore.getState().profile !== null;
    let wasSignedIn = false;
    const follow = () => {
      const now = signedIn();
      if (now === wasSignedIn) return;
      wasSignedIn = now;
      if (now) void actions.refresh();
      else challengeStore.setState({ status: 'idle', snapshot: null });
    };
    const poller = new SocialPoller({
      poll: actions.poll,
      view: () => ({
        active: signedIn(),
        panelOpen: uiStore.getState().marketOpen && uiStore.getState().marketTab === 'events',
        hidden: document.visibilityState === 'hidden',
      }),
    });
    const update = () => {
      follow();
      poller.update();
    };
    const stopCloud = cloudStore.subscribe(update);
    const stopSocial = socialStore.subscribe(update);
    const stopUi = uiStore.subscribe(update);
    document.addEventListener('visibilitychange', update);
    update();
    stopWatching = () => {
      stopCloud();
      stopSocial();
      stopUi();
      document.removeEventListener('visibilitychange', update);
      poller.dispose();
    };
  });

  return () => {
    disposed = true;
    stopWatching();
  };
}
