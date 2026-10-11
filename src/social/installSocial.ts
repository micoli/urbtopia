import { cloudEnabled } from '../persistence/cloud/cloudConfig';
import { cloudStore } from '../store/cloudStore';
import { socialStore } from '../store/socialStore';
import { loadSocialClient } from './loadSocialClient';
import { createSocialActions } from './socialActions';

export function installSocial(): () => void {
  if (!cloudEnabled) return () => {};

  let disposed = false;
  let stopAccountWatch = () => {};

  void loadSocialClient().then((client) => {
    if (!client || disposed) return;
    const actions = createSocialActions(client, socialStore.getState());
    socialStore.getState().enable(actions);
    let knownEmail: string | null = null;
    const follow = (email: string | null) => {
      if (email === knownEmail) return;
      knownEmail = email;
      if (email) void actions.refresh();
    };
    follow(cloudStore.getState().account?.email ?? null);
    stopAccountWatch = cloudStore.subscribe((store) => follow(store.account?.email ?? null));
  });

  return () => {
    disposed = true;
    stopAccountWatch();
  };
}
