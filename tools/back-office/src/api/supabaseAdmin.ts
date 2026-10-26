import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../../src/persistence/cloud/database.types'
import type { AccountSummary } from '../domain/accounts'
import { biggestCityStats, groupByCity, type CityGroup } from '../domain/cityGroups'
import { neutralHandle } from '../domain/handle'
import { statsOfEnvelope, type SaveStats } from '../domain/saveStats'
import type { Profile } from '../domain/profiles'

export type AdminClient = SupabaseClient<Database>

const USERS_PER_PAGE = 1000
const MAX_USER_PAGES = 20
const ROWS_PER_PAGE = 1000
const PERMANENT_BAN = '876000h'

export function createAdminClient({ url, serviceKey }: Pick<Profile, 'url' | 'serviceKey'>): AdminClient {
  return createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}

async function fetchAllRows<Row>(fetchRange: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }>): Promise<Row[]> {
  const rows: Row[] = []
  for (let from = 0; ; from += ROWS_PER_PAGE) {
    const { data, error } = await fetchRange(from, from + ROWS_PER_PAGE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if ((data?.length ?? 0) < ROWS_PER_PAGE) return rows
  }
}

async function fetchAllUsers(client: AdminClient) {
  const users = []
  for (let page = 1; page <= MAX_USER_PAGES; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: USERS_PER_PAGE })
    if (error) throw new Error(error.message)
    users.push(...data.users)
    if (data.users.length < USERS_PER_PAGE) break
  }
  return users
}

export async function listAccounts(client: AdminClient): Promise<AccountSummary[]> {
  const [users, profiles, saves] = await Promise.all([
    fetchAllUsers(client),
    fetchAllRows((from, to) => client.from('urb_profiles').select('user_id, handle, avatar').order('user_id').range(from, to)),
    fetchAllRows((from, to) => client.from('urb_saves').select('user_id, revision').order('user_id').order('revision').range(from, to)),
  ])
  const profileOf = new Map(profiles.map(profile => [profile.user_id, profile]))
  const saveCounts = new Map<string, number>()
  for (const save of saves) saveCounts.set(save.user_id, (saveCounts.get(save.user_id) ?? 0) + 1)
  return users.map(user => ({
    id: user.id,
    email: user.email || null,
    anonymous: user.is_anonymous ?? !user.email,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    bannedUntil: (user as { banned_until?: string | null }).banned_until ?? null,
    handle: profileOf.get(user.id)?.handle ?? null,
    avatar: profileOf.get(user.id)?.avatar ?? null,
    saveCount: saveCounts.get(user.id) ?? 0,
  }))
}

export interface SaveRevision {
  cityId: string
  revision: number
  formatVersion: number
  clientSavedAt: string
  createdAt: string
  size: number
  stats: SaveStats
  envelope: unknown
}

// The name other players read, when the City has a Showcase: the player's own, or the default after an Admin reset.
export type OnlineCityGroup = CityGroup<SaveRevision> & { onlineName: string | null }

export interface AccountDetail {
  friendCount: number
  medals: { code: string; earnedAt: string }[]
  cities: OnlineCityGroup[]
}

export async function loadAccountDetail(client: AdminClient, userId: string): Promise<AccountDetail> {
  const [friends, medals, saves, showcases] = await Promise.all([
    client.from('urb_friendships').select('user_low', { count: 'exact', head: true }).eq('state', 'accepted').or(`user_low.eq.${userId},user_high.eq.${userId}`),
    client.from('urb_medals').select('medal_code, earned_at').eq('user_id', userId).order('earned_at', { ascending: false }),
    client.from('urb_saves').select('city_id, revision, format_version, envelope, client_saved_at, created_at').eq('user_id', userId).order('revision', { ascending: false }),
    client.from('urb_showcase').select('city_id, city_name').eq('user_id', userId),
  ])
  for (const { error } of [friends, medals, saves, showcases]) if (error) throw new Error(error.message)
  return {
    friendCount: friends.count ?? 0,
    medals: (medals.data ?? []).map(medal => ({ code: medal.medal_code, earnedAt: medal.earned_at })),
    cities: withOnlineNames(groupByCity((saves.data ?? []).map(save => ({
      cityId: save.city_id,
      revision: save.revision,
      formatVersion: save.format_version,
      clientSavedAt: save.client_saved_at,
      createdAt: save.created_at,
      size: JSON.stringify(save.envelope).length,
      stats: statsOfEnvelope(save.envelope),
      envelope: save.envelope,
    }))), new Map((showcases.data ?? []).map(showcase => [showcase.city_id, showcase.city_name]))),
  }
}

function withOnlineNames(groups: CityGroup<SaveRevision>[], names: ReadonlyMap<string, string>): OnlineCityGroup[] {
  return groups.map(group => ({ ...group, onlineName: names.get(group.cityId) ?? null }))
}

// The name goes back to its Seed-based default, and the name it replaces cannot be published again.
export async function resetCityName(client: AdminClient, userId: string, cityId: string, defaultName: string): Promise<void> {
  const { data, error: readError } = await client.from('urb_showcase').select('city_name').eq('user_id', userId).eq('city_id', cityId).single()
  if (readError) throw new Error(readError.message)
  const { error } = await client.from('urb_showcase').update({ city_name: defaultName, blocked_city_name: data.city_name }).eq('user_id', userId).eq('city_id', cityId)
  if (error) throw new Error(error.message)
}

export async function loadLatestSaveStats(client: AdminClient, userIds: string[]): Promise<Map<string, SaveStats>> {
  const entries = await Promise.all(
    userIds.map(async (userId) => {
      const { data, error } = await client.from('urb_saves').select('city_id, revision, envelope').eq('user_id', userId).order('revision', { ascending: false }).limit(30)
      if (error) throw new Error(error.message)
      return [userId, biggestCityStats(data.map(save => ({ cityId: save.city_id, revision: save.revision, envelope: save.envelope, stats: statsOfEnvelope(save.envelope) })))] as const
    }),
  )
  return new Map(entries.flatMap(([userId, stats]) => (stats ? [[userId, stats] as const] : [])))
}

export async function setBanned(client: AdminClient, userId: string, banned: boolean): Promise<void> {
  const { error } = await client.auth.admin.updateUserById(userId, { ban_duration: banned ? PERMANENT_BAN : 'none' })
  if (error) throw new Error(error.message)
}

export async function setHandle(client: AdminClient, userId: string, handle: string): Promise<void> {
  const { data, error: readError } = await client.from('urb_profiles').select('social_revision').eq('user_id', userId).single()
  if (readError) throw new Error(readError.message)
  const { error } = await client.from('urb_profiles').update({ handle, social_revision: data.social_revision + 1 }).eq('user_id', userId)
  if (error) throw new Error(error.code === '23505' ? 'This Handle is already taken' : error.message)
}

export const resetHandle = (client: AdminClient, userId: string) => setHandle(client, userId, neutralHandle(userId))
