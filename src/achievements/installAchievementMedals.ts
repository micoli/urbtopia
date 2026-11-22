import { completedCategories, medalNamesOf, type AchievementCategoryId } from '../core';
import { enabledFlagIds, featureFlagStore } from '../featureFlags/featureFlags';
import { cloudStore } from '../store/cloudStore';
import { gameStore } from '../store/gameStore';
import { readOnlyStore } from '../store/readOnlyStore';
import { socialStore } from '../store/socialStore';
import { announceCategoryComplete, announceMedal } from '../store/toastStore';
import { ACHIEVEMENT_MEDAL_STORAGE_KEY, readMedalsDone, writeMedalsDone } from './medalOutbox';
import type { AchievementMedalClient } from './types';

const loadSupabaseClient = () => import('./supabaseMedalClient').then((module) => module.loadAchievementMedalClient());

// Declares each completed category to the server, which keeps one Medal per account and category; a City that completes one later, or an offline player, is declared at the next synchronisation.
export function installAchievementMedals(loadClient: () => Promise<AchievementMedalClient | null> = loadSupabaseClient): () => void {
  let done = readMedalsDone();
  let client: AchievementMedalClient | null = null;
  let disposed = false;
  let syncing = false;
  let known = new Set<AchievementCategoryId>(completedCategories(gameStore.getState().state, enabledFlagIds()));
  const accountId = () => cloudStore.getState().account?.userId;

  const announceCompletions = () => {
    if (readOnlyStore.getState().readOnly) return;
    const now = completedCategories(gameStore.getState().state, enabledFlagIds());
    for (const category of now.filter((candidate) => !known.has(candidate))) announceCategoryComplete(category);
    known = new Set(now);
  };

  const sync = async () => {
    const id = accountId();
    if (disposed || syncing || !client || !id || !cloudStore.getState().account?.email || !socialStore.getState().profile || readOnlyStore.getState().readOnly) return;
    const waiting = completedCategories(gameStore.getState().state, enabledFlagIds()).filter((category) => !done[id]?.includes(category));
    if (waiting.length === 0) return;
    syncing = true;
    try {
      for (const category of waiting) {
        const names = medalNamesOf(category);
        const receipt = await client.award(category, names.fr, names.en);
        if (disposed || accountId() !== id) return;
        done = { ...done, [id]: [...(done[id] ?? []), category] };
        writeMedalsDone(done);
        if (receipt.earned) announceMedal(category);
      }
    } catch {
      // The category stays waiting: the next synchronisation tries again.
    } finally {
      syncing = false;
    }
  };

  const update = () => {
    announceCompletions();
    void sync();
  };

  const stopGame = gameStore.subscribe((current, previous) => {
    if (current.state.achievements !== previous.state.achievements) update();
  });
  const stopCloud = cloudStore.subscribe((current, previous) => {
    if (current.account?.userId !== previous.account?.userId || current.account?.email !== previous.account?.email) update();
  });
  const stopFlags = featureFlagStore.subscribe((current, previous) => {
    if (current.enabled !== previous.enabled) update();
  });
  const stopSocial = socialStore.subscribe((current, previous) => {
    if (!!current.profile !== !!previous.profile) update();
  });
  const onStorage = (event: StorageEvent) => {
    if (event.key !== ACHIEVEMENT_MEDAL_STORAGE_KEY) return;
    done = readMedalsDone();
  };
  window.addEventListener('online', update);
  window.addEventListener('storage', onStorage);
  const timer = setInterval(() => { if (document.visibilityState === 'visible') void sync(); }, 30_000);
  void loadClient().then((loaded) => {
    if (disposed) return;
    client = loaded;
    void sync();
  }).catch(() => {});
  return () => {
    disposed = true;
    stopGame();
    stopCloud();
    stopFlags();
    stopSocial();
    window.removeEventListener('online', update);
    window.removeEventListener('storage', onStorage);
    clearInterval(timer);
  };
}
