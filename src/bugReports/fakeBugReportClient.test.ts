import { describe, expect, it } from 'vitest';
import { FakeBugReportClient } from './fakeBugReportClient';
import { BugReportError, type BugReportSubmission } from './types';

const report = (description: string): BugReportSubmission => ({ description, camera: null, context: {}, cityId: null, citySeed: null, screenshot: null, city: null });

describe('FakeBugReportClient', () => {
  it('refuses the sixth report of a day, then accepts again a day later', async () => {
    let now = 0;
    const client = new FakeBugReportClient({ now: () => now });
    for (let index = 0; index < 5; index++) await client.send(report(`bug ${index}`));
    await expect(client.send(report('six'))).rejects.toMatchObject({ kind: 'rate-limited' });
    now = 86_400_001;
    await expect(client.send(report('six'))).resolves.toBeGreaterThan(0);
  });

  it('shows an Admin reply as unread until the thread is opened, and closes the thread when resolved', async () => {
    const client = new FakeBugReportClient();
    const id = await client.send(report('roads'));
    client.adminReply(id, 'Looking');
    expect((await client.list())[0]?.unread).toBe(true);
    expect((await client.get(id)).replies).toHaveLength(1);
    expect((await client.list())[0]?.unread).toBe(false);
    client.resolve(id);
    await expect(client.reply(id, 'still there')).rejects.toBeInstanceOf(BugReportError);
  });

  it('refuses an empty description and an account without email', async () => {
    await expect(new FakeBugReportClient().send(report('   '))).rejects.toMatchObject({ kind: 'invalid' });
    await expect(new FakeBugReportClient({ hasEmail: false }).send(report('x'))).rejects.toMatchObject({ kind: 'email-required' });
  });
});
