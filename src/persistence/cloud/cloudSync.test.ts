import { describe, expect, it } from 'vitest';
import { newGame } from '../../core';
import { CURRENT_VERSION, serializeEnvelope } from '../envelope';
import { readCloudMeta } from '../meta';
import { MemorySaveStore, SAVE_KEY } from '../saveStore';
import { CloudSync, PUSH_INTERVAL_MS, type CloudStatus } from './cloudSync';
import { FakeCloudSaveClient } from './fakeCloudSaveClient';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const game = newGame({ seed: 'amber-fox-4821', now: T0 });

function envelopeAt(savedAt: number): string {
  return serializeEnvelope(game, savedAt);
}

function setup(client: FakeCloudSaveClient, clock: { now: number }) {
  const store = new MemorySaveStore();
  const log = { adopted: [] as string[], previousKept: 0, statuses: [] as CloudStatus[], canPush: true };
  const sync = new CloudSync({
    client,
    store,
    now: () => clock.now,
    local: {
      adopt: (envelope) => {
        log.adopted.push(envelope);
        store.put(SAVE_KEY, envelope);
      },
      keepAsPreviousVersion: () => {
        log.previousKept += 1;
      },
    },
    canPush: () => log.canPush,
    onStatus: (status) => log.statuses.push(status),
  });
  const edit = (savedAt: number) => {
    store.put(SAVE_KEY, envelopeAt(savedAt));
    sync.noteEdit();
  };
  return { store, sync, log, edit };
}

function world() {
  const clock = { now: T0 };
  const client = new FakeCloudSaveClient(() => clock.now);
  return { clock, client, device: () => setup(client, clock) };
}

describe('CloudSync pushing', () => {
  it('pushes the first save, then at most every 5 minutes', async () => {
    const { clock, client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();
    expect(client.pushes).toHaveLength(1);
    expect(a.sync.current).toEqual({ kind: 'synced', at: T0 });

    clock.now += MINUTE;
    a.edit(clock.now);
    await a.sync.tick();
    expect(client.pushes).toHaveLength(1);
    expect(a.sync.current.kind).toBe('synced');

    clock.now += PUSH_INTERVAL_MS;
    await a.sync.tick();
    expect(client.pushes).toHaveLength(2);
    expect(readCloudMeta(a.store).baseRevision).toBe(2);
  });

  it('does not push when nothing changed or when this tab does not own the save', async () => {
    const { clock, client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    a.log.canPush = false;
    await a.sync.tick();
    expect(client.pushes).toHaveLength(0);

    a.log.canPush = true;
    await a.sync.tick();
    clock.now += 10 * MINUTE;
    await a.sync.tick();
    expect(client.pushes).toHaveLength(1);
  });

  it('pushes on demand ignoring the 5 minute spacing', async () => {
    const { clock, client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();
    clock.now += MINUTE;
    a.edit(clock.now);
    await a.sync.pushNow();
    expect(client.pushes).toHaveLength(2);
  });

  it('sends a keepalive push when the page is hidden', async () => {
    const { client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    a.sync.pushOnPageHide();
    await Promise.resolve();
    expect(client.pushes).toHaveLength(1);
    expect(client.pushes[0]?.keepalive).toBe(true);
    expect(client.pushes[0]?.formatVersion).toBe(CURRENT_VERSION);
  });
});

describe('CloudSync offline', () => {
  it('keeps the local data, retries with backoff and recovers when back online', async () => {
    const { clock, client, device } = world();
    const a = device();
    a.edit(T0);
    client.goOffline();
    await a.sync.start();
    expect(a.sync.current).toEqual({ kind: 'offline' });
    expect(a.store.get(SAVE_KEY)).toBe(envelopeAt(T0));

    client.goOnline();
    clock.now += 10_000;
    await a.sync.tick();
    expect(client.rows).toHaveLength(0);

    clock.now += 30_000;
    await a.sync.tick();
    expect(client.rows).toHaveLength(1);
    expect(a.sync.current.kind).toBe('synced');
  });

  it('doubles the delay after each failure', async () => {
    const { clock, client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();
    client.goOffline();
    clock.now += PUSH_INTERVAL_MS;
    a.edit(clock.now);
    await a.sync.tick();
    clock.now += 30_000;
    await a.sync.tick();
    client.goOnline();
    clock.now += 30_000;
    await a.sync.tick();
    expect(client.pushes).toHaveLength(1);
    clock.now += 30_000;
    await a.sync.tick();
    expect(client.pushes).toHaveLength(2);
  });
});

describe('CloudSync across devices', () => {
  it('lets a new device with no save load the Cloud save', async () => {
    const { clock, client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();

    clock.now += HOUR;
    const b = device();
    await b.sync.start();
    expect(b.log.adopted).toEqual([envelopeAt(T0)]);
    expect(b.sync.current.kind).toBe('synced');
    expect(readCloudMeta(b.store).baseRevision).toBe(client.rows[0]?.revision);
  });

  it('loads a newer Cloud save over an untouched local save', async () => {
    const { clock, device } = world();
    const a = device();
    const b = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();
    await b.sync.start();
    expect(b.log.adopted).toHaveLength(1);

    clock.now += 10 * MINUTE;
    a.edit(clock.now);
    await a.sync.tick();
    const reopened = setup(world().client, clock);
    expect(reopened.log.adopted).toHaveLength(0);

    await b.sync.start();
    expect(b.log.adopted).toHaveLength(2);
  });

  it('never overwrites: diverged cities produce a Save conflict', async () => {
    const { clock, client, device } = world();
    const a = device();
    const b = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();
    await b.sync.start();

    clock.now += 10 * MINUTE;
    a.edit(clock.now);
    b.edit(clock.now + 1);
    await a.sync.tick();
    const cloudBefore = client.rows[client.rows.length - 1]?.envelope;

    await b.sync.pushNow();
    expect(b.sync.current.kind).toBe('conflict');
    expect(client.rows[client.rows.length - 1]?.envelope).toBe(cloudBefore);
    expect(b.log.adopted).toHaveLength(1);

    clock.now += 10 * MINUTE;
    await b.sync.tick();
    expect(client.pushes.filter((push) => push.envelope === envelopeAt(clock.now - 10 * MINUTE + 1))).toHaveLength(1);
  });

  it('keeps the local city and the cloud city as a previous version when local wins', async () => {
    const { clock, client, device } = world();
    const a = device();
    const b = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();
    await b.sync.start();
    clock.now += 10 * MINUTE;
    a.edit(clock.now);
    b.edit(clock.now + 1);
    await a.sync.tick();
    await b.sync.pushNow();

    await b.sync.resolveConflict('local');
    expect(b.sync.current.kind).toBe('synced');
    expect(client.rows.map((row) => row.envelope)).toContain(envelopeAt(clock.now));
    expect(client.rows[client.rows.length - 1]?.envelope).toBe(envelopeAt(clock.now + 1));
  });

  it('adopts the cloud city and keeps the local one as a previous version when cloud wins', async () => {
    const { clock, client, device } = world();
    const a = device();
    const b = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();
    await b.sync.start();
    clock.now += 10 * MINUTE;
    a.edit(clock.now);
    b.edit(clock.now + 1);
    await a.sync.tick();
    await b.sync.pushNow();

    await b.sync.resolveConflict('cloud');
    expect(b.log.adopted[b.log.adopted.length - 1]).toBe(envelopeAt(clock.now));
    expect(b.log.previousKept).toBe(1);
    expect(client.rows.map((row) => row.envelope)).toContain(envelopeAt(clock.now + 1));
    expect(client.rows[client.rows.length - 1]?.envelope).toBe(envelopeAt(clock.now));
  });

  it('treats a device that never synced and has a city as a conflict, not as untouched', async () => {
    const { client, device } = world();
    client.seed(envelopeAt(T0 + 5), T0 + 5);
    const b = device();
    b.edit(T0);
    await b.sync.start();
    expect(b.sync.current.kind).toBe('conflict');
    expect(b.log.adopted).toHaveLength(0);
    expect(client.pushes).toHaveLength(0);
  });

  it('pushes again after the Cloud save was deleted from another device', async () => {
    const { clock, client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();
    await client.deleteMine();

    clock.now += HOUR;
    await a.sync.start();
    expect(a.sync.current).toEqual({ kind: 'pending' });
    await a.sync.pushNow();
    expect(client.rows).toHaveLength(1);
  });
});

describe('CloudSync newer app version', () => {
  it('refuses a Cloud save newer than the app and never overwrites it', async () => {
    const { client, device } = world();
    const newer = JSON.stringify({ ...JSON.parse(envelopeAt(T0)), version: CURRENT_VERSION + 1 });
    client.seed(newer, T0);
    const a = device();
    await a.sync.start();
    expect(a.sync.current).toEqual({ kind: 'error', reason: 'newer-version' });
    expect(a.log.adopted).toHaveLength(0);

    a.edit(T0 + MINUTE);
    await a.sync.tick();
    await a.sync.pushNow();
    expect(client.pushes).toHaveLength(0);
  });
});

describe('CloudSync history and deletion', () => {
  it('restores a previous version after keeping the local city', async () => {
    const { clock, client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();
    clock.now += 2 * HOUR;
    a.edit(clock.now);
    await a.sync.tick();
    const versions = await a.sync.listVersions();
    expect(versions).toHaveLength(2);

    const oldest = versions[versions.length - 1]!;
    await a.sync.restoreVersion(oldest.revision);
    expect(a.log.adopted[a.log.adopted.length - 1]).toBe(envelopeAt(T0));
    expect(client.rows[client.rows.length - 1]?.envelope).toBe(envelopeAt(T0));
  });

  it('deletes the cloud data and forgets the sync state', async () => {
    const { client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();
    await a.sync.deleteCloudData();
    expect(client.rows).toHaveLength(0);
    expect(client.signedIn).toBe(false);
    expect(readCloudMeta(a.store).baseRevision).toBe(0);
    expect(a.sync.current).toEqual({ kind: 'idle' });
  });
});

describe('CloudSync safeguards', () => {
  it('can restore the oldest version even with unsynced local changes', async () => {
    const { clock, client, device } = world();
    const a = device();
    for (let i = 0; i < 4; i += 1) {
      a.edit(clock.now);
      await a.sync.pushNow();
      clock.now += 2 * HOUR;
    }
    a.edit(clock.now);
    const versions = await a.sync.listVersions();
    const oldest = versions[versions.length - 1]!;
    await a.sync.restoreVersion(oldest.revision);
    expect(a.sync.current.kind).toBe('synced');
    expect(a.log.previousKept).toBe(1);
    expect(client.rows[client.rows.length - 1]?.envelope).toBe(envelopeAt(T0));
  });

  it('stays quiet after the cloud data was deleted, until the player saves again', async () => {
    const { clock, client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();
    await a.sync.deleteCloudData();

    clock.now += HOUR;
    await a.sync.tick();
    await a.sync.start();
    expect(client.rows).toHaveLength(0);
    expect(client.signedIn).toBe(false);

    await a.sync.pushNow();
    expect(client.rows).toHaveLength(1);
  });

  it('does nothing in a tab that does not own the save', async () => {
    const { client, device } = world();
    const a = device();
    a.edit(T0);
    a.log.canPush = false;
    await a.sync.start();
    expect(client.signedIn).toBe(false);
    expect(a.sync.current).toEqual({ kind: 'idle' });
  });

  it('does not create a revision when saving now without changes', async () => {
    const { client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.pushNow();
    await a.sync.pushNow();
    expect(client.pushes).toHaveLength(1);
    expect(a.sync.current.kind).toBe('synced');
  });

  it('keeps the previous status when only listing versions', async () => {
    const { client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.pushNow();
    client.goOffline();
    expect(await a.sync.listVersions()).toEqual([]);
    expect(a.sync.current).toEqual({ kind: 'offline' });
  });
});

describe('CloudSync accounts', () => {
  it('does not mistake the city of another account for a synced one', async () => {
    const { client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();

    client.switchUser('user-with-email', 'me@example.com');
    client.seed(envelopeAt(T0 + 5), T0 + 5);
    await a.sync.accountChanged();
    expect(a.sync.current.kind).toBe('conflict');
    expect(readCloudMeta(a.store).userId).toBe('user-with-email');
    expect(a.log.adopted).toHaveLength(0);
  });

  it('keeps the same history when the anonymous account gets an email', async () => {
    const { client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();

    client.emails.set('user-1', 'me@example.com');
    await a.sync.accountChanged();
    expect(a.sync.current.kind).toBe('synced');
    expect(readCloudMeta(a.store).baseRevision).toBe(1);
  });

  it('signs out then continues with a fresh anonymous account', async () => {
    const { client, device } = world();
    const a = device();
    a.edit(T0);
    await a.sync.start();
    await a.sync.tick();

    await a.sync.signOut();
    expect(a.sync.current.kind).toBe('pending');
    expect(client.rows).toHaveLength(0);
    await a.sync.pushNow();
    expect(client.rows).toHaveLength(1);
  });

  it('reports the account it signed in with', async () => {
    const { client, clock } = world();
    const seen: unknown[] = [];
    const store = new MemorySaveStore();
    const sync = new CloudSync({
      client,
      store,
      now: () => clock.now,
      local: { adopt: () => {}, keepAsPreviousVersion: () => {} },
      canPush: () => true,
      onStatus: () => {},
      onAccount: (account) => seen.push(account),
    });
    client.emails.set('user-1', 'me@example.com');
    await sync.start();
    expect(seen).toEqual([{ userId: 'user-1', email: 'me@example.com' }]);
  });
});

