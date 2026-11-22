import { describe, expect, it } from 'vitest';
import { socialStore } from '../store/socialStore';
import { FakeSocialWorld } from './fakeSocialClient';
import { createSocialActions } from './socialActions';

const NOW = 1_700_000_000_000;

function setup() {
  const world = new FakeSocialWorld(() => NOW);
  const alice = world.addPlayer('a');
  world.addPlayer('b', 'b@example.com');
  socialStore.setState({ status: 'idle', profile: null });
  const signals: string[] = [];
  const actions = createSocialActions(alice, socialStore.getState(), () => null, () => null, null, () => [], (signal) => signals.push(signal));
  return { actions, signals };
}

describe('what the social actions tell the Achievements', () => {
  it('reports a Handle chosen, and a Friend request sent', async () => {
    const { actions, signals } = setup();
    await actions.setHandle('Alice');
    await actions.sendRequest('b@example.com');
    expect(signals).toEqual(['handleSet', 'friendRequestSent']);
  });

  it('reports nothing when the Handle is refused', async () => {
    const { actions, signals } = setup();
    await actions.setHandle('!');
    expect(signals).toEqual([]);
  });
});
