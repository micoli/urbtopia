import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ANNUAL_EVENT_NOTICES_KEY, annualEventNoticeStore, noticeKeyOf, parseDismissedNotices } from './annualEventNoticeStore';

describe('parseDismissedNotices', () => {
  it('reads the stored keys and drops anything else', () => {
    expect(parseDismissedNotices(null)).toEqual([]);
    expect(parseDismissedNotices('not json')).toEqual([]);
    expect(parseDismissedNotices('{"a":1}')).toEqual([]);
    expect(parseDismissedNotices(JSON.stringify(['halloween:2026', 3, 'bad key', 'easter:2027']))).toEqual(['halloween:2026', 'easter:2027']);
  });
});

describe('annualEventNoticeStore', () => {
  const storage = new Map<string, string>();
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
    annualEventNoticeStore.setState({ dismissed: [] });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('remembers a dismissal once, in the browser', () => {
    annualEventNoticeStore.getState().dismiss(noticeKeyOf('halloween', 2026));
    annualEventNoticeStore.getState().dismiss(noticeKeyOf('halloween', 2026));
    expect(annualEventNoticeStore.getState().dismissed).toEqual(['halloween:2026']);
    expect(JSON.parse(storage.get(ANNUAL_EVENT_NOTICES_KEY)!)).toEqual(['halloween:2026']);
  });

  it('tells the years of an event apart', () => {
    annualEventNoticeStore.getState().dismiss(noticeKeyOf('halloween', 2026));
    expect(annualEventNoticeStore.getState().dismissed).not.toContain(noticeKeyOf('halloween', 2027));
  });
});
