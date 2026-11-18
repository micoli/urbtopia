import * as Sentry from '@sentry/react';
import type { BugReportClient, BugReportSubmission } from './types';

export type FeedbackSink = (report: BugReportSubmission, reportId: number) => void;

export const sendFeedbackToSentry: FeedbackSink = (report, reportId) => {
  Sentry.withScope((scope) => {
    scope.setContext('report', report.context);
    scope.setTags({ reportId: String(reportId), cityId: report.cityId ?? 'none', citySeed: report.citySeed ?? 'none' });
    Sentry.captureFeedback({ message: report.description });
  });
};

// Sentry is a copy: a failure there never fails the report the player just sent.
export function withSentryFeedback(client: BugReportClient, sink: FeedbackSink = sendFeedbackToSentry): BugReportClient {
  return {
    ...client,
    async send(report) {
      const id = await client.send(report);
      try {
        sink(report, id);
      } catch {
        return id;
      }
      return id;
    },
  };
}
