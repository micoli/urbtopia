import { describe, expect, it, vi } from 'vitest';
import type { BugReportClient, BugReportSubmission } from './types';
import { withSentryFeedback } from './withSentryFeedback';

const report: BugReportSubmission = { description: 'broken', camera: null, context: {}, cityId: 'c1', citySeed: 'amber', screenshot: null, city: null };

function fakeClient(send: BugReportClient['send']): BugReportClient {
  return { send, list: vi.fn(), get: vi.fn(), reply: vi.fn() };
}

describe('withSentryFeedback', () => {
  it('forwards the sent report and its id to the sink and returns the id', async () => {
    const sink = vi.fn();
    const client = withSentryFeedback(fakeClient(async () => 42), sink);
    await expect(client.send(report)).resolves.toBe(42);
    expect(sink).toHaveBeenCalledWith(report, 42);
  });

  it('does not call the sink when the send fails', async () => {
    const sink = vi.fn();
    const client = withSentryFeedback(fakeClient(async () => Promise.reject(new Error('offline'))), sink);
    await expect(client.send(report)).rejects.toThrow('offline');
    expect(sink).not.toHaveBeenCalled();
  });

  it('keeps the report sent when the sink throws', async () => {
    const client = withSentryFeedback(fakeClient(async () => 7), () => {
      throw new Error('sentry down');
    });
    await expect(client.send(report)).resolves.toBe(7);
  });
});
