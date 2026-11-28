import { HEAVY_PAGE, readTablePages, type ExportProgress, type TableSpec, type UntypedQuery } from './exportDatabase'
import type { AdminClient } from './supabaseAdmin'

type Scope = (query: UntypedQuery, userId: string, links: Links) => UntypedQuery

interface Links {
  groupIds: string[]
  reportIds: number[]
  challengeIds: string[]
}

interface AccountTable extends TableSpec {
  scope: Scope
}

const ownedBy = (column: string): Scope => (query, userId) => query.eq(column, userId)
const eitherOf = (first: string, second: string): Scope => (query, userId) => query.or(`${first}.eq.${userId},${second}.eq.${userId}`)

// A table with no row of its own for the account is reached through the rows already read.
const TABLES: AccountTable[] = [
  { name: 'urb_profiles', orderBy: ['user_id'], scope: ownedBy('user_id') },
  { name: 'urb_saves', orderBy: ['city_id', 'revision'], pageSize: HEAVY_PAGE, scope: ownedBy('user_id') },
  { name: 'urb_save_stashes', orderBy: ['city_id', 'id'], pageSize: HEAVY_PAGE, scope: ownedBy('user_id') },
  { name: 'urb_city_leases', orderBy: ['city_id'], scope: ownedBy('user_id') },
  { name: 'urb_showcase', orderBy: ['city_id'], scope: ownedBy('user_id') },
  { name: 'urb_hall_of_fame_opt_outs', orderBy: ['city_id'], scope: ownedBy('user_id') },
  { name: 'urb_friendships', orderBy: ['user_low', 'user_high'], scope: eitherOf('user_low', 'user_high') },
  { name: 'urb_messages', orderBy: ['id'], scope: eitherOf('sender_id', 'recipient_id') },
  { name: 'urb_group_members', orderBy: ['group_id', 'user_id'], scope: ownedBy('user_id') },
  { name: 'urb_groups', orderBy: ['id'], scope: (query, _userId, links) => query.in('id', links.groupIds) },
  { name: 'urb_group_messages', orderBy: ['id'], scope: ownedBy('sender_id') },
  { name: 'urb_trade_offers', orderBy: ['id'], scope: eitherOf('sender_id', 'recipient_id') },
  { name: 'urb_shipments', orderBy: ['id'], scope: ownedBy('user_id') },
  { name: 'urb_donations', orderBy: ['id'], scope: ownedBy('user_id') },
  { name: 'urb_challenge_acceptances', orderBy: ['city_id', 'challenge_id'], scope: ownedBy('user_id') },
  { name: 'urb_challenges', orderBy: ['id'], scope: (query, _userId, links) => query.in('id', links.challengeIds) },
  { name: 'urb_medals', orderBy: ['id'], scope: ownedBy('user_id') },
  { name: 'urb_bug_reports', orderBy: ['id'], scope: ownedBy('author_id') },
  { name: 'urb_bug_report_attachments', orderBy: ['report_id'], pageSize: HEAVY_PAGE, scope: (query, _userId, links) => query.in('report_id', links.reportIds) },
  { name: 'urb_bug_report_replies', orderBy: ['id'], scope: (query, _userId, links) => query.in('report_id', links.reportIds) },
  { name: 'urb_search_attempts', orderBy: ['attempted_at'], scope: ownedBy('user_id') },
]

type Row = Record<string, unknown>

function idsOf<Id extends string | number>(rows: string[] | null, column: string): Id[] {
  if (!rows) return []
  return [...new Set(rows.map(row => (JSON.parse(row) as Row)[column] as Id))]
}

// Same layout as the database export, restricted to one account; every table keeps its own name as key.
export async function exportAccount(client: AdminClient, userId: string, onProgress: (progress: ExportProgress) => void): Promise<Blob> {
  const chunks: string[] = [`{"exportedAt":${JSON.stringify(new Date().toISOString())},"userId":${JSON.stringify(userId)}`]

  onProgress({ table: 'auth.users', rows: 0 })
  const { data, error } = await client.auth.admin.getUserById(userId)
  if (error) throw new Error(error.message)
  chunks.push(`,"auth_user":${JSON.stringify(data.user)}`)

  const links: Links = { groupIds: [], reportIds: [], challengeIds: [] }
  const missing: string[] = []
  for (const table of TABLES) {
    onProgress({ table: table.name, rows: 0 })
    const rows = await readTablePages(client, table, count => onProgress({ table: table.name, rows: count }), query => table.scope(query, userId, links))
    if (!rows) {
      missing.push(table.name)
      continue
    }
    chunks.push(`,${JSON.stringify(table.name)}:[${rows.join(',')}]`)
    if (table.name === 'urb_group_members') links.groupIds = idsOf(rows, 'group_id')
    if (table.name === 'urb_challenge_acceptances') links.challengeIds = idsOf(rows, 'challenge_id')
    if (table.name === 'urb_bug_reports') links.reportIds = idsOf(rows, 'id')
  }
  chunks.push(`,"missingTables":${JSON.stringify(missing)}`)
  chunks.push('}')
  return new Blob(chunks, { type: 'application/json' })
}
