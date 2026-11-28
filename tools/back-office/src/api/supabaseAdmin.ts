import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../../src/persistence/cloud/database.types'
import type { AccountSummary } from '../domain/accounts'
import { biggestCityStats, groupByCity, type CityGroup } from '../domain/cityGroups'
import { neutralHandle } from '../domain/handle'
import { inWindow, type DateWindow } from '../domain/dateFilter'
import { factsOfSave, type SaveFacts } from '../domain/saveFacts'
import type { LatestSavedPrefs } from '../domain/savedPrefsTable'
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

export async function fetchAllUsers(client: AdminClient) {
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

const PREFS_USERS_PER_QUERY = 50
const SAVES_PER_BATCH = 5

interface LatestSave {
  userId: string
  cityId: string
  revision: number
  savedAt: string
  cityIds: string[]
}

interface LatestSaves {
  // The newest save of each account, when its own date falls in the window.
  users: LatestSave[]
  // The newest save of each City, when its own date falls in the window; the newest save of each account in `users` is among them.
  cities: LatestSave[]
}

async function listLatestSaves(client: AdminClient, window: DateWindow): Promise<LatestSaves> {
  const rows = await fetchAllRows((from, to) => client.from('urb_saves').select('user_id, revision, city_id, client_saved_at').order('user_id').order('revision').range(from, to))
  const newestOfCity = new Map<string, LatestSave>()
  const newestOfUser = new Map<string, LatestSave>()
  const cityIdsOf = new Map<string, string[]>()
  for (const { user_id, revision, city_id, client_saved_at } of rows) {
    const cityIds = cityIdsOf.get(user_id) ?? []
    if (!cityIds.includes(city_id)) cityIds.push(city_id)
    cityIdsOf.set(user_id, cityIds)
    const save: LatestSave = { userId: user_id, cityId: city_id, revision, savedAt: client_saved_at, cityIds }
    const cityKey = `${user_id}/${city_id}`
    if (revision > (newestOfCity.get(cityKey)?.revision ?? 0)) newestOfCity.set(cityKey, save)
    if (revision > (newestOfUser.get(user_id)?.revision ?? 0)) newestOfUser.set(user_id, save)
  }
  const inPeriod = (save: LatestSave) => inWindow(Date.parse(save.savedAt), window)
  return { users: [...newestOfUser.values()].filter(inPeriod), cities: [...newestOfCity.values()].filter(inPeriod) }
}

// The `prefs` of the newest save of each account, read from the stored envelope without opening the game state.
export async function loadLatestSavedPrefs(client: AdminClient, window: DateWindow): Promise<LatestSavedPrefs[]> {
  const { users } = await listLatestSaves(client, window)
  const revisionOf = new Map(users.map(save => [save.userId, save.revision]))
  const latest: LatestSavedPrefs[] = []
  for (let from = 0; from < users.length; from += PREFS_USERS_PER_QUERY) {
    const chunk = users.slice(from, from + PREFS_USERS_PER_QUERY)
    const { data, error } = await client.from('urb_saves').select('user_id, revision, client_saved_at, prefs:envelope->prefs').in('user_id', chunk.map(save => save.userId)).in('revision', chunk.map(save => save.revision))
    if (error) throw new Error(error.message)
    for (const row of data) if (revisionOf.get(row.user_id) === row.revision) latest.push({ userId: row.user_id, revision: row.revision, savedAt: row.client_saved_at, prefs: row.prefs })
  }
  return latest
}

export interface FactsProgress {
  loaded: number
  total: number
}

export interface LoadedFacts {
  // The latest save of each user.
  users: SaveFacts[]
  // The latest save of each City: the users' saves are among them, as the same objects.
  cities: SaveFacts[]
}

// Full envelopes weigh up to 1 MB: a few saves at a time, one exact query each, and only the facts are kept once each is read.
export async function loadLatestSaveFacts(client: AdminClient, window: DateWindow, onProgress: (progress: FactsProgress) => void): Promise<LoadedFacts> {
  const { users, cities } = await listLatestSaves(client, window)
  const isUserLatest = new Set(users.map(save => `${save.userId}/${save.revision}`))
  const loaded: LoadedFacts = { users: [], cities: [] }
  onProgress({ loaded: 0, total: cities.length })
  for (let from = 0; from < cities.length; from += SAVES_PER_BATCH) {
    const batch = cities.slice(from, from + SAVES_PER_BATCH)
    const rows = await Promise.all(batch.map(async save => {
      const { data, error } = await client.from('urb_saves').select('format_version, client_saved_at, envelope').eq('user_id', save.userId).eq('revision', save.revision).single()
      if (error) throw new Error(error.message)
      return factsOfSave({ userId: save.userId, cityId: save.cityId, cityIds: save.cityIds, formatVersion: data.format_version, savedAt: data.client_saved_at }, data.envelope)
    }))
    batch.forEach((save, index) => {
      loaded.cities.push(rows[index]!)
      if (isUserLatest.has(`${save.userId}/${save.revision}`)) loaded.users.push(rows[index]!)
    })
    onProgress({ loaded: Math.min(from + SAVES_PER_BATCH, cities.length), total: cities.length })
  }
  return loaded
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
