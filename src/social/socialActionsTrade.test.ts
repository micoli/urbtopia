import { describe, expect, it } from 'vitest';
import { MATERIALS, createBuilding, dispatch, newGame, unlockCitizensOf, type Command, type ErrorKey, type GameState } from '../core';
import { socialStore } from '../store/socialStore';
import { FakeSocialWorld } from './fakeSocialClient';
import { createSocialActions } from './socialActions';
import { TradeCoordinator, type TradeGame } from './tradeCoordinator';

const NOW = 1_700_000_000_000;
const material = Object.keys(MATERIALS).find((item) => unlockCitizensOf(item as never) === 0)!;

function game(stock: number): TradeGame & { current: GameState } {
  const base = newGame({ seed: 'trade-actions', now: NOW });
  const holder = {
    current: { ...base, urbs: 100, buildings: [createBuilding(1, 'storehouse', 55, 55, 0)], nextId: 2, storage: { materials: { [material]: stock }, goods: {} } } as GameState,
    state: () => holder.current,
    apply(command: Command): ErrorKey | null {
      const result = dispatch(holder.current, command, NOW);
      if (!result.ok) return result.error.key;
      holder.current = result.state;
      return null;
    },
    persist: () => {},
    canTrade: () => true,
  };
  return holder;
}

async function setup() {
  const world = new FakeSocialWorld(() => NOW);
  const alice = world.addPlayer('a');
  const bob = world.addPlayer('b', 'b@example.com');
  await alice.setHandle('Alice');
  await bob.setHandle('Bob');
  await alice.sendRequestByEmail('b@example.com');
  await bob.acceptRequest('a');
  socialStore.setState({ status: 'idle', profile: null, tradeBusy: false, tradeFailure: null });
  const aliceGame = game(10);
  let n = 0;
  const trades = new TradeCoordinator({ client: alice, game: aliceGame, newId: () => `offer-${(n += 1)}` });
  const actions = createSocialActions(alice, socialStore.getState(), () => socialStore.getState().profile?.revision ?? null, () => null, trades, () => socialStore.getState().profile?.offers ?? []);
  await actions.refresh();
  return { actions, aliceGame, bob };
}

describe('trade actions', () => {
  it('creates an offer, shows it in the social state and clears the busy flag', async () => {
    const { actions, aliceGame } = await setup();
    const outcome = await actions.createTradeOffer('b', [{ item: material, quantity: 3 }], 20);
    expect(outcome.ok).toBe(true);
    expect(aliceGame.current.storage.materials).toMatchObject({ [material]: 7 });
    expect(socialStore.getState()).toMatchObject({ tradeBusy: false, tradeFailure: null, profile: { offers: [{ role: 'sender', price: 20, state: 'open' }] } });
  });

  it('keeps the failure of a refused offer for the form', async () => {
    const { actions } = await setup();
    await actions.createTradeOffer('b', [{ item: material, quantity: 99 }], 20);
    expect(socialStore.getState().tradeFailure).toEqual({ kind: 'game', key: 'error.missingMaterials' });
    expect(socialStore.getState().tradeBusy).toBe(false);
  });

  it('declines an offer and reconciles', async () => {
    const { actions, aliceGame, bob } = await setup();
    await actions.createTradeOffer('b', [{ item: material, quantity: 3 }], 20);
    const bobView = await bob.list();
    const offerId = bobView.changed ? bobView.offers[0]!.id : '';
    await bob.declineTradeOffer(offerId);
    await actions.poll();
    await actions.reconcileTrades();
    expect(aliceGame.current.storage.materials).toMatchObject({ [material]: 10 });
  });
});
