import { describe, expect, it } from 'vitest';
import { createBugReportInboxStore } from './createBugReportInboxStore';
import { FakeBugReportClient } from './fakeBugReportClient';
import type { BugReportSubmission } from './types';

const report = (description: string): BugReportSubmission => ({ description, camera: null, context: {}, cityId: null, citySeed: null, screenshot: null, city: null });

async function setup() {
  const client = new FakeBugReportClient();
  const id = await client.send(report('roads vanish'));
  const store = createBugReportInboxStore(async () => client);
  return { client, id, store };
}

describe('bug report inbox store', () => {
  it('counts the reports with an unread Admin reply', async () => {
    const { client, id, store } = await setup();
    await store.getState().refresh();
    expect(store.getState().unread).toBe(0);
    client.adminReply(id, 'Looking');
    await store.getState().refresh();
    expect(store.getState().unread).toBe(1);
  });

  it('clears the unread count when the thread is opened', async () => {
    const { client, id, store } = await setup();
    client.adminReply(id, 'Looking');
    await store.getState().openThread(id);
    expect(store.getState().thread?.replies).toHaveLength(1);
    expect(store.getState().unread).toBe(0);
  });

  it('adds the reply of the player to the thread', async () => {
    const { id, store } = await setup();
    await store.getState().openThread(id);
    expect(await store.getState().reply('It is on Main street')).toBe(true);
    expect(store.getState().thread?.replies.map((reply) => reply.body)).toEqual(['It is on Main street']);
  });

  it('keeps the thread and shows the error when the thread is closed', async () => {
    const { client, id, store } = await setup();
    await store.getState().openThread(id);
    client.resolve(id);
    expect(await store.getState().reply('late')).toBe(false);
    expect(store.getState().failed?.kind).toBe('closed');
    expect(store.getState().thread?.id).toBe(id);
  });

  it('reports a failure to load, without crashing', async () => {
    const { client, store } = await setup();
    client.failNext = new (await import('./types')).BugReportError('offline');
    await store.getState().refresh();
    expect(store.getState().failed?.kind).toBe('offline');
  });
});
