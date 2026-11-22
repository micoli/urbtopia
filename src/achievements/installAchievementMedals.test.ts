import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACHIEVEMENTS, newGame, type GameState } from '../core';
import type { CloudAccount } from '../persistence/cloud/types';
import type { SocialState } from '../social/types';

vi.hoisted(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('window', { location: { search: '' }, addEventListener: () => {}, removeEventListener: () => {} });
  vi.stubGlobal('document', { visibilityState: 'visible' });
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => void storage.set(key, value), removeItem: (key: string) => void storage.delete(key) });
});

const { gameStore } = await import('../store/gameStore');
const { cloudStore } = await import('../store/cloudStore');
const { socialStore } = await import('../store/socialStore');
const { toastStore } = await import('../store/toastStore');
const { installAchievementMedals } = await import('./installAchievementMedals');
const { FakeAchievementMedalWorld } = await import('./fakeMedalClient');
const { readMedalsDone } = await import('./medalOutbox');

const completeCity = (): GameState => ({ ...newGame({ seed: 'medal', now: 0 }), achievements: ACHIEVEMENTS.map(({ id }) => id) });
const signIn = () => {
  cloudStore.setState({ account: { userId: 'player', email: 'player@example.com' } as CloudAccount });
  socialStore.setState({ profile: { handle: 'Builder' } as SocialState });
};
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Medals of the Achievement categories', () => {
  beforeEach(() => {
    localStorage.removeItem('urbtopia:achievement-medals');
    gameStore.getState().replaceState(newGame({ seed: 'medal', now: 0 }));
    cloudStore.setState({ account: null });
    socialStore.setState({ profile: null });
    toastStore.getState().dismiss();
  });
  afterEach(() => vi.restoreAllMocks());

  it('declares a completed category once the account is signed in, and tells the player', async () => {
    const client = new FakeAchievementMedalWorld().client('player');
    const award = vi.fn(client.award);
    const dispose = installAchievementMedals(async () => ({ award }));
    await settle();
    signIn();
    gameStore.getState().replaceState(completeCity());
    await settle();
    expect(award).toHaveBeenCalledWith('transport', 'Succès : Transports', 'Achievements: Transport');
    expect(toastStore.getState().text).toBe('Medal earned: Transport');
    expect(readMedalsDone()).toEqual({ player: ['transport'] });
    dispose();
  });

  it('waits for an account instead of losing the Medal', async () => {
    const award = vi.fn(async () => ({ medalCode: 'achievements-transport', earned: true }));
    const dispose = installAchievementMedals(async () => ({ award }));
    gameStore.getState().replaceState(completeCity());
    await settle();
    expect(award).not.toHaveBeenCalled();
    expect(toastStore.getState().text).toBe('Category complete: Transport');
    signIn();
    await settle();
    expect(award).toHaveBeenCalledTimes(1);
    dispose();
  });

  it('does not declare a category again once the server confirmed it, and says nothing when the account already had the Medal', async () => {
    signIn();
    const award = vi.fn(async () => ({ medalCode: 'achievements-transport', earned: false }));
    const dispose = installAchievementMedals(async () => ({ award }));
    await settle();
    gameStore.getState().replaceState(completeCity());
    await settle();
    gameStore.getState().replaceState({ ...completeCity(), urbs: 5 });
    await settle();
    expect(award).toHaveBeenCalledTimes(1);
    expect(toastStore.getState().text).not.toContain('Medal earned');
    dispose();
  });
});
