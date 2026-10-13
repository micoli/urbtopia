import { cloudEnabled } from '../persistence/cloud/cloudConfig';
import { SocialPoller } from '../social/socialPoller';
import { challengeStore } from '../store/challengeStore';
import { cloudStore } from '../store/cloudStore';
import { socialStore } from '../store/socialStore';
import { uiStore } from '../store/uiStore';
import { createChallengeActions } from './challengeActions';
import { loadChallengeClient } from './loadChallengeClient';

export function installChallenges(): () => void {
  if (!cloudEnabled) return () => {};

  let disposed = false;
  let stopWatching = () => {};

  void loadChallengeClient().then((client) => {
    if (!client || disposed) return;
    const actions = createChallengeActions(client, challengeStore.getState(), () => challengeStore.getState());
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
        panelOpen: uiStore.getState().marketOpen,
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
