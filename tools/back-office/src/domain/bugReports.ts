import { fromBase64, gunzip } from '../../../../src/bugReports/cityAttachment'

export type ReportStatus = 'new' | 'seen' | 'resolved'

export interface ReportSummary {
  id: number
  authorId: string
  description: string
  status: ReportStatus
  createdAt: string
  adminUnread: boolean
}

export interface ReportAttachments {
  screenshot: string | null
  cityJson: unknown
  cityGzip: string | null
}

export interface ReportReply {
  id: number
  fromAdmin: boolean
  body: string
  createdAt: string
}

export type ReportFilter = 'open' | 'all' | ReportStatus

export const REPORT_FILTERS: { filter: ReportFilter; label: string }[] = [
  { filter: 'open', label: 'Open' },
  { filter: 'new', label: 'New' },
  { filter: 'seen', label: 'Seen' },
  { filter: 'resolved', label: 'Resolved' },
  { filter: 'all', label: 'All' },
]

export function filterReports(reports: ReportSummary[], filter: ReportFilter): ReportSummary[] {
  if (filter === 'all') return reports
  if (filter === 'open') return reports.filter(report => report.status !== 'resolved')
  return reports.filter(report => report.status === filter)
}

export function hasCity(attachments: ReportAttachments): boolean {
  return attachments.cityJson != null || attachments.cityGzip != null
}

// The City as the game reads it: the JSON text of its save envelope.
export async function cityEnvelopeText(attachments: ReportAttachments): Promise<string | null> {
  if (attachments.cityJson != null) return JSON.stringify(attachments.cityJson)
  if (attachments.cityGzip == null) return null
  return new TextDecoder().decode(await gunzip(fromBase64(attachments.cityGzip)))
}

export function canReply(status: ReportStatus): boolean {
  return status !== 'resolved'
}

export function statusTone(status: ReportStatus): 'indigo' | 'amber' | 'green' {
  if (status === 'new') return 'indigo'
  return status === 'seen' ? 'amber' : 'green'
}
