import { dispatch } from '../core';
import { cloudEnabled } from '../persistence/cloud/cloudConfig';
import { saveNowHandle } from '../persistence/saveNow';
import { gameStore } from '../store/gameStore';
import { readOnlyStore } from '../store/readOnlyStore';
import { cloudStore } from '../store/cloudStore';
import { socialStore } from '../store/socialStore';
import { uiStore } from '../store/uiStore';
import { loadSocialClient } from './loadSocialClient';
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
      state: () => gameStore.getState().state,
      apply: (command) => {
        const result = dispatch(gameStore.getState().state, command, Date.now());
        if (!result.ok) return result.error.key;
        gameStore.getState().replaceState(result.state, 'command');
        return null;
      },
      persist: () => saveNowHandle.current(),
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
    socialStore.getState().enable(actions);
    let knownEmail: string | null = null;
    const follow = (email: string | null) => {
      if (email === knownEmail) return;
      knownEmail = email;
      if (email) void actions.refresh();
    };
    follow(cloudStore.getState().account?.email ?? null);
    const poller = new SocialPoller({
      poll: async () => {
        await actions.poll();
        await actions.pollConversation();
        await actions.reconcileTrades();
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
