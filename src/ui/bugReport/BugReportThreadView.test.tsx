import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { BugReportThread } from '../../bugReports/types';
import { BugReportThreadView } from './BugReportThreadView';

const thread = (status: BugReportThread['status']): BugReportThread => ({
  id: 1,
  description: 'Roads vanish',
  status,
  createdAt: '2026-11-06T10:00:00Z',
  replies: [
    { id: 1, fromAdmin: true, body: 'Which lake?', createdAt: '2026-11-06T11:00:00Z' },
    { id: 2, fromAdmin: false, body: 'The north one', createdAt: '2026-11-06T12:00:00Z' },
  ],
});

describe('BugReportThreadView', () => {
  it('shows both sides of the thread and a reply field while the report is open', () => {
    const html = renderToStaticMarkup(<BugReportThreadView thread={thread('seen')} />);
    expect(html).toContain('Which lake?');
    expect(html).toContain('The north one');
    expect(html).toContain('bug-report-reply--team');
    expect(html).toContain('<input');
  });

  it('closes the thread once the report is resolved', () => {
    const html = renderToStaticMarkup(<BugReportThreadView thread={thread('resolved')} />);
    expect(html).not.toContain('<input');
    expect(html).toContain('This report is resolved');
  });
});
