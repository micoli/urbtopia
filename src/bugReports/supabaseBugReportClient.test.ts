import { describe, expect, it } from 'vitest';
import { toBugReportError } from './supabaseBugReportClient';

describe('toBugReportError', () => {
  it('maps the database markers', () => {
    expect(toBugReportError({ message: 'urb_email_required' }).kind).toBe('email-required');
    expect(toBugReportError({ message: 'urb_report_closed' }).kind).toBe('closed');
    expect(toBugReportError({ message: 'urb_reply_invalid' }).kind).toBe('invalid');
    expect(toBugReportError({ message: 'urb_report_not_found' }).kind).toBe('not-found');
  });

  it('carries the wait of the daily limit', () => {
    const error = toBugReportError({ message: 'urb_rate_limited', details: '3600' });
    expect(error.kind).toBe('rate-limited');
    expect(error.retryAfterSeconds).toBe(3600);
  });

  it('maps a size check, a missing session and a network failure', () => {
    expect(toBugReportError({ message: 'violates check', code: '23514' }).kind).toBe('invalid');
    expect(toBugReportError({ message: 'x', code: '42501' }).kind).toBe('unauthenticated');
    expect(toBugReportError({ message: 'Failed to fetch', code: '' }).kind).toBe('offline');
    expect(toBugReportError({ message: 'weird', code: 'XX000' }).kind).toBe('unknown');
  });
});
