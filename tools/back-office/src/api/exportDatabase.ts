import type { AdminClient } from './supabaseAdmin'
import { fetchAllUsers } from './supabaseAdmin'

export interface TableSpec {
  name: string
  orderBy: string[]
  pageSize?: number
}

export const LIGHT_PAGE = 1000
export const HEAVY_PAGE = 20

// The order columns are the primary key, so that paging neither skips nor repeats a row.
const TABLES: TableSpec[] = [
  { name: 'urb_profiles', orderBy: ['user_id'] },
  { name: 'urb_saves', orderBy: ['user_id', 'city_id', 'revision'], pageSize: HEAVY_PAGE },
  { name: 'urb_save_stashes', orderBy: ['user_id', 'city_id', 'id'], pageSize: HEAVY_PAGE },
  { name: 'urb_city_leases', orderBy: ['user_id', 'city_id'] },
  { name: 'urb_showcase', orderBy: ['user_id', 'city_id'] },
  { name: 'urb_hall_of_fame_opt_outs', orderBy: ['user_id', 'city_id'] },
  { name: 'urb_friendships', orderBy: ['user_low', 'user_high'] },
  { name: 'urb_messages', orderBy: ['id'] },
  { name: 'urb_groups', orderBy: ['id'] },
  { name: 'urb_group_members', orderBy: ['group_id', 'user_id'] },
  { name: 'urb_group_messages', orderBy: ['id'] },
  { name: 'urb_trade_offers', orderBy: ['id'] },
  { name: 'urb_shipments', orderBy: ['id'] },
  { name: 'urb_donations', orderBy: ['id'] },
  { name: 'urb_challenge_templates', orderBy: ['id'] },
  { name: 'urb_challenges', orderBy: ['id'] },
  { name: 'urb_challenge_acceptances', orderBy: ['user_id', 'city_id', 'challenge_id'] },
  { name: 'urb_medals', orderBy: ['user_id', 'challenge_id'] },
  { name: 'urb_bug_reports', orderBy: ['id'] },
  { name: 'urb_bug_report_attachments', orderBy: ['report_id'], pageSize: HEAVY_PAGE },
  { name: 'urb_bug_report_replies', orderBy: ['id'] },
  { name: 'urb_search_attempts', orderBy: ['user_id', 'attempted_at'] },
  { name: 'urb_forbidden_handle_words', orderBy: ['word'] },
]

export interface UntypedQuery {
  order: (column: string) => UntypedQuery
  eq: (column: string, value: string) => UntypedQuery
  in: (column: string, values: Array<string | number>) => UntypedQuery
  or: (filters: string) => UntypedQuery
  range: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { code?: string; message: string } | null }>
}

interface UntypedClient {
  from: (table: string) => { select: (columns: string) => UntypedQuery }
}

export interface ExportProgress {
  table: string
  rows: number
}

const TABLE_NOT_IN_SCHEMA = 'PGRST205'

// A table of a migration not released yet is absent from the project: null, not a failure.
export async function readTablePages(client: AdminClient, { name, orderBy, pageSize = LIGHT_PAGE }: TableSpec, onRows: (rows: number) => void, scope: (query: UntypedQuery) => UntypedQuery = query => query): Promise<string[] | null> {
  const parts: string[] = []
  let total = 0
  for (let from = 0; ; from += pageSize) {
    // The table name is dynamic, so the typed query builder cannot follow it.
    let query = scope((client as unknown as UntypedClient).from(name).select('*'))
    for (const column of orderBy) query = query.order(column)
    const { data, error } = await query.range(from, from + pageSize - 1)
    if (error?.code === TABLE_NOT_IN_SCHEMA) return null
    if (error) throw new Error(`${name}: ${error.message}`)
    const rows = data ?? []
    for (const row of rows) parts.push(JSON.stringify(row))
    total += rows.length
    onRows(total)
    if (rows.length < pageSize) return parts
  }
}

// Rows are serialised page by page and kept as strings in a Blob, so the heavy saves are never parsed twice.
export async function exportDatabase(client: AdminClient, onProgress: (progress: ExportProgress) => void): Promise<Blob> {
  const chunks: string[] = [`{"exportedAt":${JSON.stringify(new Date().toISOString())}`]

  onProgress({ table: 'auth.users', rows: 0 })
  const users = await fetchAllUsers(client)
  chunks.push(`,"auth_users":[${users.map(user => JSON.stringify(user)).join(',')}]`)
  onProgress({ table: 'auth.users', rows: users.length })

  const missing: string[] = []
  for (const spec of TABLES) {
    onProgress({ table: spec.name, rows: 0 })
    const rows = await readTablePages(client, spec, count => onProgress({ table: spec.name, rows: count }))
    if (rows) chunks.push(`,${JSON.stringify(spec.name)}:[${rows.join(',')}]`)
    else missing.push(spec.name)
  }
  chunks.push(`,"missingTables":${JSON.stringify(missing)}`)
  chunks.push('}')
  return new Blob(chunks, { type: 'application/json' })
}
