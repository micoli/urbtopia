import { cloudEnabled } from '../persistence/cloud/cloudConfig';
import { saveNowHandle } from '../persistence/saveNow';
import { gameStore } from '../store/gameStore';
import { createLiveGamePort } from '../store/liveGamePort';
import { liveCommandGateway } from '../store/liveCommandGateway';
import { readOnlyStore } from '../store/readOnlyStore';
import { cloudStore } from '../store/cloudStore';
import { socialStore } from '../store/socialStore';
import { uiStore } from '../store/uiStore';
import { requestedLocalAuthEmail } from '../persistence/cloud/localAuth';
import { claimLocalHandle } from './localHandle';
import { loadSocialClient } from './loadSocialClient';
import { createGroupActions } from './groupActions';
import { createSocialActions } from './socialActions';
import { SocialPoller } from './socialPoller';
import { TradeCoordinator, type TradeGame } from './tradeCoordinator';

export function installSocial(): () => void {
  if (!cloudEnabled) return () => {};

  let disposed = false;
  let stopWatching = () => {};

  void loadSocialClient().then((client) => {
    if (!client || disposed) return;
    const game: TradeGame = {
      ...createLiveGamePort({ store: gameStore, gateway: liveCommandGateway, persist: () => saveNowHandle.current() }),
      canTrade: () => !readOnlyStore.getState().readOnly,
    };
    const trades = new TradeCoordinator({ client, game, newId: () => crypto.randomUUID() });
    const actions = createSocialActions(
      client,
      socialStore.getState(),
      () => socialStore.getState().profile?.revision ?? null,
      () => socialStore.getState().conversation,
      trades,
      () => socialStore.getState().profile?.offers ?? [],
    );
    const groupActions = createGroupActions(
      client,
      socialStore.getState(),
      {
        groups: () => socialStore.getState().groups,
        revision: () => socialStore.getState().groupsRevision,
        conversation: () => socialStore.getState().groupConversation,
      },
      () => actions.refresh(),
    );
    socialStore.getState().enable(actions, groupActions);
    const localAuthEmail = requestedLocalAuthEmail();
    let knownEmail: string | null = null;
    const follow = (email: string | null) => {
      if (email === knownEmail) return;
      knownEmail = email;
      if (!email) return;
      const load = () => void actions.refresh().then(() => groupActions.refresh());
      if (email === localAuthEmail) return void claimLocalHandle(client, email).finally(load);
      load();
    };
    follow(cloudStore.getState().account?.email ?? null);
    const poller = new SocialPoller({
      poll: async () => {
        await actions.poll();
        await actions.pollConversation();
        await actions.reconcileTrades();
        await groupActions.pollOpen();
        await groupActions.poll();
      },
      view: () => ({
        active: socialStore.getState().profile !== null,
        panelOpen: uiStore.getState().socialOpen,
        hidden: document.visibilityState === 'hidden',
      }),
    });
    const update = () => poller.update();
    const stopAccount = cloudStore.subscribe((store) => follow(store.account?.email ?? null));
    const stopSocial = socialStore.subscribe(update);
    const stopUi = uiStore.subscribe(update);
    document.addEventListener('visibilitychange', update);
    update();
    stopWatching = () => {
      stopAccount();
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
