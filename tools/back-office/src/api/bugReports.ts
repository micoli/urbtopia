import type { AdminClient } from './supabaseAdmin'
import type { ReportAttachments, ReportReply, ReportStatus, ReportSummary } from '../domain/bugReports'

const MAX_REPLY_LENGTH = 500

export interface ReportDetail {
  id: number
  authorId: string
  authorEmail: string | null
  authorHandle: string | null
  description: string
  status: ReportStatus
  createdAt: string
  camera: unknown
  context: Record<string, unknown>
  cityId: string | null
  citySeed: string | null
  attachments: ReportAttachments
  replies: ReportReply[]
}

export async function listReports(client: AdminClient): Promise<ReportSummary[]> {
  const { data, error } = await client.from('urb_bug_reports').select('id, author_id, description, status, created_at, admin_unread').order('id', { ascending: false })
  if (error) throw new Error(error.message)
  return data.map(row => ({ id: row.id, authorId: row.author_id, description: row.description, status: row.status as ReportStatus, createdAt: row.created_at, adminUnread: row.admin_unread }))
}

export async function loadReport(client: AdminClient, id: number): Promise<ReportDetail> {
  const [report, attachments, replies] = await Promise.all([
    client.from('urb_bug_reports').select('*').eq('id', id).single(),
    client.from('urb_bug_report_attachments').select('screenshot, city_json, city_gzip').eq('report_id', id).maybeSingle(),
    client.from('urb_bug_report_replies').select('id, from_admin, body, created_at').eq('report_id', id).order('id'),
  ])
  for (const { error } of [report, attachments, replies]) if (error) throw new Error(error.message)
  const row = report.data!
  const [author, profile] = await Promise.all([client.auth.admin.getUserById(row.author_id), client.from('urb_profiles').select('handle').eq('user_id', row.author_id).maybeSingle()])
  return {
    id: row.id,
    authorId: row.author_id,
    authorEmail: author.data.user?.email ?? null,
    authorHandle: profile.data?.handle ?? null,
    description: row.description,
    status: row.status as ReportStatus,
    createdAt: row.created_at,
    camera: row.camera,
    context: (row.context ?? {}) as Record<string, unknown>,
    cityId: row.city_id,
    citySeed: row.city_seed,
    attachments: { screenshot: attachments.data?.screenshot ?? null, cityJson: attachments.data?.city_json ?? null, cityGzip: attachments.data?.city_gzip ?? null },
    replies: (replies.data ?? []).map(reply => ({ id: reply.id, fromAdmin: reply.from_admin, body: reply.body, createdAt: reply.created_at })),
  }
}

export async function setReportStatus(client: AdminClient, id: number, status: ReportStatus): Promise<void> {
  const { error } = await client.from('urb_bug_reports').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function markReportRead(client: AdminClient, id: number): Promise<void> {
  const { error } = await client.from('urb_bug_reports').update({ admin_unread: false }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function replyToReport(client: AdminClient, id: number, body: string): Promise<void> {
  const text = body.trim()
  if (text.length < 1 || text.length > MAX_REPLY_LENGTH) throw new Error(`A reply holds 1 to ${MAX_REPLY_LENGTH} characters`)
  const { error } = await client.from('urb_bug_report_replies').insert({ report_id: id, from_admin: true, body: text })
  if (error) throw new Error(error.message)
}
