import { annualEventsWithItems, openAnnualEvents, type AnnualEventId, type AnnualEventWindow } from '../../core';
import { noticeKeyOf } from '../../store/annualEventNoticeStore';

export interface AnnualEventNoticeContent {
  eventId: AnnualEventId;
  window: AnnualEventWindow;
  key: string;
}

// The first open Annual event that has items and whose notice for this year was not dismissed.
export function nextAnnualEventNotice(now: number, dismissed: readonly string[]): AnnualEventNoticeContent | undefined {
  const withItems = annualEventsWithItems();
  return openAnnualEvents(now)
    .filter(({ id }) => withItems.has(id))
    .map(({ id, window }) => ({ eventId: id, window, key: noticeKeyOf(id, window.year) }))
    .find(({ key }) => !dismissed.includes(key));
}
