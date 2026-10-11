import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSocialWorld } from './fakeSocialClient';
import { createSocialActions } from './socialActions';
import { PANEL_CLOSED_INTERVAL_MS, PANEL_OPEN_INTERVAL_MS, SocialPoller, type PollerView } from './socialPoller';
import { socialStore } from '../store/socialStore';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup(initial: Partial<PollerView> = {}) {
  const view: PollerView = { active: true, panelOpen: false, hidden: false, ...initial };
  const poll = vi.fn(async () => {});
  const poller = new SocialPoller({ poll, view: () => view });
  return { view, poll, poller };
}

describe('SocialPoller', () => {
  it('polls at once, then every 60 s while the panel is closed', async () => {
    const { poll, poller } = setup();
    poller.update();
    expect(poll).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(PANEL_CLOSED_INTERVAL_MS * 2);
    expect(poll).toHaveBeenCalledTimes(3);
    poller.dispose();
  });

  it('polls at once when the panel opens, then every 15 s', async () => {
    const { view, poll, poller } = setup();
    poller.update();
    await vi.advanceTimersByTimeAsync(0);
    poll.mockClear();
    view.panelOpen = true;
    poller.update();
    expect(poll).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(PANEL_OPEN_INTERVAL_MS * 2);
    expect(poll).toHaveBeenCalledTimes(3);
    poller.dispose();
  });

  it('goes back to 60 s when the panel closes, without polling again at once', async () => {
    const { view, poll, poller } = setup({ panelOpen: true });
    poller.update();
    poll.mockClear();
    view.panelOpen = false;
    poller.update();
    expect(poll).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(PANEL_OPEN_INTERVAL_MS * 2);
    expect(poll).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(PANEL_CLOSED_INTERVAL_MS);
    expect(poll).toHaveBeenCalledTimes(1);
    poller.dispose();
  });

  it('stops while the tab is hidden and polls at once when it is visible again', async () => {
    const { view, poll, poller } = setup();
    poller.update();
    view.hidden = true;
    poller.update();
    poll.mockClear();
    await vi.advanceTimersByTimeAsync(PANEL_CLOSED_INTERVAL_MS * 3);
    expect(poll).not.toHaveBeenCalled();
    view.hidden = false;
    poller.update();
    expect(poll).toHaveBeenCalledTimes(1);
    poller.dispose();
  });

  it('never polls for an account without email and Handle', async () => {
    const { poll, poller } = setup({ active: false });
    poller.update();
    await vi.advanceTimersByTimeAsync(PANEL_CLOSED_INTERVAL_MS * 3);
    expect(poll).not.toHaveBeenCalled();
  });

  it('does not stack polls when one is slow', async () => {
    const { view, poller } = setup();
    let release = () => {};
    const slow = vi.fn(() => new Promise<void>((resolve) => (release = resolve)));
    const slowPoller = new SocialPoller({ poll: slow, view: () => view });
    slowPoller.update();
    await vi.advanceTimersByTimeAsync(PANEL_CLOSED_INTERVAL_MS * 2);
    expect(slow).toHaveBeenCalledTimes(1);
    release();
    slowPoller.dispose();
    poller.dispose();
  });
});

describe('poll action', () => {
  it('sends the cursor and only updates the store on a change', async () => {
    const world = new FakeSocialWorld(() => 0);
    const alice = world.addPlayer('a');
    const bob = world.addPlayer('b', 'b@example.com', 'Bob');
    socialStore.setState({ status: 'idle', profile: null });
    const store = socialStore.getState();
    const list = vi.spyOn(alice, 'list');
    const actions = createSocialActions(alice, store, () => socialStore.getState().profile?.revision ?? null);
    await actions.setHandle('Alice');
    list.mockClear();

    await actions.poll();
    expect(list).toHaveBeenLastCalledWith(socialStore.getState().profile?.revision);
    const before = socialStore.getState().profile;
    await actions.poll();
    expect(socialStore.getState().profile).toBe(before);

    await bob.sendRequestByEmail('a@example.com');
    await actions.poll();
    expect(socialStore.getState().profile?.incoming).toMatchObject([{ handle: 'Bob' }]);
  });

  it('keeps the last state when the server cannot be reached', async () => {
    const world = new FakeSocialWorld(() => 0);
    const alice = world.addPlayer('a');
    socialStore.setState({ status: 'idle', profile: null });
    const actions = createSocialActions(alice, socialStore.getState(), () => socialStore.getState().profile?.revision ?? null);
    await actions.setHandle('Alice');
    alice.goOffline();
    await actions.poll();
    expect(socialStore.getState()).toMatchObject({ status: 'ready', profile: { handle: 'Alice' } });
  });
});
