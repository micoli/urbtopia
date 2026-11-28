import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadBugReportClient = vi.fn();
vi.mock('./loadBugReportClient', () => ({ loadBugReportClient }));

describe('getBugReportClient', () => {
  beforeEach(() => {
    vi.resetModules();
    loadBugReportClient.mockReset();
  });

  it('loads the client once when it succeeds', async () => {
    const client = { list: vi.fn() };
    loadBugReportClient.mockResolvedValue(client);
    const { getBugReportClient } = await import('./bugReportClientHandle');
    expect(await getBugReportClient()).toBe(client);
    expect(await getBugReportClient()).toBe(client);
    expect(loadBugReportClient).toHaveBeenCalledTimes(1);
  });

  it('tries again after a failed load', async () => {
    const client = { list: vi.fn() };
    loadBugReportClient.mockRejectedValueOnce(new Error('chunk gone')).mockResolvedValueOnce(client);
    const { getBugReportClient } = await import('./bugReportClientHandle');
    await expect(getBugReportClient()).rejects.toThrow('chunk gone');
    expect(await getBugReportClient()).toBe(client);
  });
});
