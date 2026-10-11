import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { GOODS, MATERIALS, createBuilding, dispatch, newGame, storageCapacity, unlockCitizensOf, type GameState, type TradeEffect, type TradeLine } from '../index';
import { handleCommand, isError } from '../engine/commands';

const NOW = 1_700_000_000_000;
const DAY = 86_400_000;
const material = (Object.keys(MATERIALS).find((item) => unlockCitizensOf(item as never) === 0) ?? 'wood');
const good = Object.keys(GOODS).find((item) => unlockCitizensOf(item as never) === 0)!;
const lockedGood = Object.keys(GOODS).find((item) => unlockCitizensOf(item as never) > 0)!;

function city(extra: Partial<GameState> = {}): GameState {
  const state = newGame({ seed: 'trade-ledger', now: NOW });
  return { ...state, urbs: 1_000, buildings: [{ ...createBuilding(1, 'storehouse', 55, 55, 0) }], nextId: 2, storage: { materials: { [material]: 10 }, goods: { [good]: 5 } }, ...extra } as GameState;
}

const run = (state: GameState, command: Parameters<typeof handleCommand>[1], now = NOW) => handleCommand(state, command, now);
const lotOf = (...lines: TradeLine[]) => lines;

function stateOf(outcome: ReturnType<typeof run>): GameState {
  if (isError(outcome)) throw new Error(outcome.key);
  return outcome.state;
}

describe('trade ledger: reserving a Lot', () => {
  it('takes the Lot out of the stock and records the effect', () => {
    const next = stateOf(run(city(), { type: 'TradeApply', offerId: 'o1', effect: 'reserve-lot', lot: lotOf({ item: material, quantity: 4 }, { item: good, quantity: 2 }), peer: 'bob' }));
    expect(next.storage.materials[material as 'wood']).toBe(6);
    expect(next.storage.goods[good as never]).toBe(3);
    expect(next.tradeLedger).toEqual([{ offerId: 'o1', effect: 'reserve-lot', at: NOW, lot: [{ item: material, quantity: 4 }, { item: good, quantity: 2 }], peer: 'bob', confirmed: false }]);
  });

  it('refuses a Lot the stock cannot cover, and changes nothing', () => {
    const outcome = run(city(), { type: 'TradeApply', offerId: 'o1', effect: 'reserve-lot', lot: lotOf({ item: material, quantity: 11 }) });
    expect(outcome).toEqual({ key: 'error.missingMaterials' });
    expect(run(city(), { type: 'TradeApply', offerId: 'o1', effect: 'reserve-lot', lot: lotOf({ item: good, quantity: 6 }) })).toEqual({ key: 'error.missingGoods' });
  });

  it.each([
    ['an empty Lot', []],
    ['a Lot of 11 lines', Array.from({ length: 11 }, (_, i) => ({ item: material, quantity: i + 1 }))],
    ['a duplicated item', [{ item: material, quantity: 1 }, { item: material, quantity: 2 }]],
    ['a null quantity', [{ item: material, quantity: 0 }]],
    ['a fractional quantity', [{ item: material, quantity: 1.5 }]],
    ['a quantity over 9 999', [{ item: material, quantity: 10_000 }]],
    ['an unknown item', [{ item: 'unobtainium', quantity: 1 }]],
  ])('refuses %s', (_label, lot) => {
    expect(run(city(), { type: 'TradeApply', offerId: 'o1', effect: 'reserve-lot', lot })).toEqual({ key: 'error.invalidTradeLot' });
  });
});

describe('trade ledger: exactly once', () => {
  it('applies an effect once however many times it is replayed', () => {
    const command = { type: 'TradeApply', offerId: 'o1', effect: 'receive-payment', urbs: 40 } as const;
    const once = stateOf(run(city(), command));
    const twice = stateOf(run(once, command));
    expect(once.urbs).toBe(1_040);
    expect(twice).toEqual(once);
    expect(twice.tradeLedger).toHaveLength(1);
  });

  it('keeps the effects of two offers apart', () => {
    let state = stateOf(run(city(), { type: 'TradeApply', offerId: 'o1', effect: 'receive-payment', urbs: 40 }));
    state = stateOf(run(state, { type: 'TradeApply', offerId: 'o2', effect: 'receive-payment', urbs: 10 }));
    expect(state.urbs).toBe(1_050);
  });

  it('confirms an effect without applying it again', () => {
    const applied = stateOf(run(city(), { type: 'TradeApply', offerId: 'o1', effect: 'receive-payment', urbs: 40 }));
    const confirmed = stateOf(run(applied, { type: 'TradeConfirm', offerId: 'o1', effect: 'receive-payment' }));
    expect(confirmed.urbs).toBe(applied.urbs);
    expect(confirmed.tradeLedger[0]?.confirmed).toBe(true);
    expect(run(applied, { type: 'TradeConfirm', offerId: 'nope', effect: 'pay' })).toEqual({ key: 'error.unknownTrade' });
  });

  it('forgets entries older than 30 days when a new one is recorded', () => {
    let state = stateOf(run(city(), { type: 'TradeApply', offerId: 'old', effect: 'receive-payment', urbs: 1 }));
    state = stateOf(run(state, { type: 'TradeApply', offerId: 'new', effect: 'receive-payment', urbs: 1 }, NOW + 31 * DAY));
    expect(state.tradeLedger.map((entry) => entry.offerId)).toEqual(['new']);
  });
});

describe('trade ledger: receiving', () => {
  it('puts a claimed Lot into the stock, only with room', () => {
    const state = city();
    const room = storageCapacity(state).materials - (state.storage.materials[material as 'wood'] ?? 0);
    const fits = stateOf(run(state, { type: 'TradeApply', offerId: 'o1', effect: 'receive-lot', lot: lotOf({ item: material, quantity: room }) }));
    expect(fits.storage.materials[material as 'wood']).toBe(10 + room);
    expect(run(state, { type: 'TradeApply', offerId: 'o1', effect: 'receive-lot', lot: lotOf({ item: material, quantity: room + 1 }) })).toEqual({ key: 'error.storageFull' });
  });

  it('does not record an effect that failed, so it can be retried', () => {
    const state = city();
    const failed = run(state, { type: 'TradeApply', offerId: 'o1', effect: 'return-lot', lot: lotOf({ item: material, quantity: 9_999 }) });
    expect(isError(failed)).toBe(true);
    expect(state.tradeLedger).toEqual([]);
  });

  it('refuses to pay for a Lot that is locked, too big or too dear', () => {
    expect(run(city(), { type: 'TradeApply', offerId: 'o1', effect: 'pay', urbs: 10, lot: lotOf({ item: lockedGood, quantity: 1 }) })).toEqual({ key: 'error.itemLocked' });
    expect(run(city(), { type: 'TradeApply', offerId: 'o1', effect: 'pay', urbs: 10, lot: lotOf({ item: material, quantity: 9_999 }) })).toEqual({ key: 'error.storageFull' });
    expect(run(city({ urbs: 5 }), { type: 'TradeApply', offerId: 'o1', effect: 'pay', urbs: 10, lot: lotOf({ item: material, quantity: 1 }) })).toEqual({ key: 'error.notEnoughUrbs' });
    expect(run(city(), { type: 'TradeApply', offerId: 'o1', effect: 'pay', urbs: 10_001, lot: lotOf({ item: material, quantity: 1 }) })).toEqual({ key: 'error.invalidPrice' });
  });

  it('refuses a Lot naming an inherited object key', () => {
    for (const item of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      expect(run(city(), { type: 'TradeApply', offerId: 'o1', effect: 'receive-lot', lot: lotOf({ item, quantity: 1 }) })).toEqual({ key: 'error.invalidTradeLot' });
    }
  });

  it('pays the price when the Lot can be received', () => {
    const next = stateOf(run(city(), { type: 'TradeApply', offerId: 'o1', effect: 'pay', urbs: 250, lot: lotOf({ item: material, quantity: 1 }), peer: 'alice' }));
    expect(next.urbs).toBe(750);
  });
});

describe('trade ledger: rollback', () => {
  it('gives back exactly what an unconfirmed reserve took, and forgets it', () => {
    const start = city();
    const reserved = stateOf(run(start, { type: 'TradeApply', offerId: 'o1', effect: 'reserve-lot', lot: lotOf({ item: material, quantity: 10 }) }));
    const back = stateOf(run(reserved, { type: 'TradeRollback', offerId: 'o1', effect: 'reserve-lot' }));
    expect(back).toEqual(start);
  });

  it('refuses to roll back a confirmed effect or an effect that cannot be undone', () => {
    const reserved = stateOf(run(city(), { type: 'TradeApply', offerId: 'o1', effect: 'reserve-lot', lot: lotOf({ item: material, quantity: 1 }) }));
    const confirmed = stateOf(run(reserved, { type: 'TradeConfirm', offerId: 'o1', effect: 'reserve-lot' }));
    expect(run(confirmed, { type: 'TradeRollback', offerId: 'o1', effect: 'reserve-lot' })).toEqual({ key: 'error.unknownTrade' });
    const paid = stateOf(run(city(), { type: 'TradeApply', offerId: 'o2', effect: 'receive-payment', urbs: 5 }));
    expect(run(paid, { type: 'TradeRollback', offerId: 'o2', effect: 'receive-payment' })).toEqual({ key: 'error.unknownTrade' });
  });
});

describe('trade ledger: no loss and no duplication', () => {
  const effectsArb = fc.array(fc.constantFrom<TradeEffect>('reserve-lot', 'receive-lot', 'return-lot', 'receive-payment', 'return-payment'), { maxLength: 20 });

  it('a replayed sequence of effects equals the same sequence applied once each', () => {
    fc.assert(
      fc.property(effectsArb, fc.integer({ min: 1, max: 4 }), (effects, repeats) => {
        const apply = (state: GameState, effect: TradeEffect, offer: string): GameState => {
          const result = dispatch(state, { type: 'TradeApply', offerId: offer, effect, lot: [{ item: material, quantity: 1 }], urbs: 3 }, NOW);
          return result.ok ? result.state : state;
        };
        let once = city();
        let many = city();
        effects.forEach((effect, index) => {
          once = apply(once, effect, `offer-${index}`);
          for (let i = 0; i < repeats; i += 1) many = apply(many, effect, `offer-${index}`);
        });
        expect(many).toEqual(once);
      }),
    );
  });

  it('a full trade moves the Lot and the price once, whatever the number of replays', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 0, max: 500 }), fc.integer({ min: 1, max: 4 }), (quantity, price, replays) => {
        const lot = [{ item: material, quantity }];
        let seller = city();
        let buyer = city({ storage: { materials: {}, goods: {} } });
        const step = (state: GameState, effect: TradeEffect, extra: { urbs?: number; lot?: typeof lot } = {}): GameState => {
          let next = state;
          for (let i = 0; i < replays; i += 1) {
            const result = dispatch(next, { type: 'TradeApply', offerId: 'trade', effect, ...extra }, NOW);
            if (result.ok) next = result.state;
          }
          return next;
        };
        seller = step(seller, 'reserve-lot', { lot });
        buyer = step(buyer, 'pay', { lot, urbs: price });
        buyer = step(buyer, 'receive-lot', { lot });
        seller = step(seller, 'receive-payment', { urbs: price });
        const unitsBefore = 10 + 0;
        expect((seller.storage.materials[material as 'wood'] ?? 0) + (buyer.storage.materials[material as 'wood'] ?? 0)).toBe(unitsBefore);
        expect(seller.urbs + buyer.urbs).toBe(2_000);
        expect(buyer.storage.materials[material as 'wood']).toBe(quantity);
        expect(seller.urbs).toBe(1_000 + price);
      }),
    );
  });

  it('a refused offer returns the Lot to its sender exactly', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (quantity) => {
        const start = city();
        const lot = [{ item: material, quantity }];
        let state = stateOf(run(start, { type: 'TradeApply', offerId: 'o', effect: 'reserve-lot', lot }));
        state = stateOf(run(state, { type: 'TradeApply', offerId: 'o', effect: 'return-lot', lot }));
        expect(state.storage).toEqual(start.storage);
      }),
    );
  });
});
