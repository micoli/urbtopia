import { describe, expect, it } from 'vitest';
import { FLAG_IDS, createFeatureFlagStore, flagOfCommand, offFlags, resolveFlags } from './featureFlags';

describe('feature flags', () => {
  it('ship off', () => {
    expect(FLAG_IDS).toEqual(expect.arrayContaining(['clubs', 'advisor', 'homeInterior']));
    expect(Object.values(offFlags()).every(value => !value)).toBe(true);
    expect(resolveFlags(null, true).clubs).toBe(false);
  });

  it('are switched on by what is stored, in a build that allows it', () => {
    expect(resolveFlags('{"clubs":true}', true).clubs).toBe(true);
    expect(resolveFlags('{"clubs":false}', true).clubs).toBe(false);
  });

  it('stay off in production whatever is stored', () => {
    expect(resolveFlags('{"clubs":true}', false).clubs).toBe(false);
  });

  it('ignore what is not a flag or not a boolean, and a stored value that is not JSON', () => {
    expect(resolveFlags('{"clubs":"yes","other":true}', true)).toEqual(offFlags());
    expect(resolveFlags('not json', true)).toEqual(offFlags());
    expect(resolveFlags('[1]', true)).toEqual(offFlags());
  });

  it('name the flag a command belongs to', () => {
    expect(flagOfCommand('SetLineup')).toBe('clubs');
    expect(flagOfCommand('PlayMatch')).toBe('clubs');
    expect(flagOfCommand('SetHomeParquet')).toBe('homeInterior');
    expect(flagOfCommand('Collect')).toBeUndefined();
  });
});

describe('feature flag store', () => {
  it('starts from the stored value, and keeps a switch in storage', () => {
    let stored: string | null = '{"clubs":true}';
    const store = createFeatureFlagStore(true, () => stored, values => { stored = JSON.stringify(values); });
    expect(store.getState().enabled.clubs).toBe(true);
    store.getState().set('clubs', false);
    expect(store.getState().enabled.clubs).toBe(false);
    expect(JSON.parse(stored!)).toMatchObject({ clubs: false });
  });

  it('refuses every switch in production until the Player subscribes to the beta', () => {
    let written = false;
    const store = createFeatureFlagStore(false, () => '{"clubs":true}', () => { written = true; });
    store.getState().set('clubs', true);
    expect(store.getState().enabled.clubs).toBe(false);
    expect(written).toBe(false);
  });

  it('turns the chosen features on once subscribed, and off again when unsubscribed', () => {
    let stored: string | null = '{"clubs":true}';
    let beta = false;
    const store = createFeatureFlagStore(false, () => stored, values => { stored = JSON.stringify(values); }, () => beta, value => { beta = value; });
    expect(store.getState().enabled.clubs).toBe(false);
    store.getState().subscribe(true);
    expect(beta).toBe(true);
    expect(store.getState().enabled.clubs).toBe(true);
    store.getState().set('advisor', true);
    expect(JSON.parse(stored!)).toMatchObject({ clubs: true, advisor: true });
    store.getState().subscribe(false);
    expect(store.getState().enabled).toEqual(offFlags());
    expect(store.getState().chosen.advisor).toBe(true);
  });

  it('remembers the subscription across reloads', () => {
    const store = createFeatureFlagStore(false, () => '{"advisor":true}', () => undefined, () => true, () => undefined);
    expect(store.getState().enabled.advisor).toBe(true);
  });
});
