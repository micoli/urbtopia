import type { ReportSummary } from './bugReports'

export function countUnread(reports: ReportSummary[]): number {
  return reports.filter(report => report.adminUnread).length
}

export function badgedTitle(title: string, unread: number): string {
  return unread > 0 ? `(${unread}) ${title}` : title
}

export function badgeLabel(unread: number): string {
  return unread > 99 ? '99+' : String(unread)
}
