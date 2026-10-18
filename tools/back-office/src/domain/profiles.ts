export const PROFILE_COLORS = {
  green: '#10b981',
  blue: '#3b82f6',
  violet: '#8b5cf6',
  pink: '#ec4899',
  amber: '#f59e0b',
  red: '#ef4444',
  slate: '#64748b',
} as const

export type ProfileColor = keyof typeof PROFILE_COLORS

export const DEFAULT_URL = 'http://127.0.0.1:54321'
export const DEFAULT_GAME_URL = 'http://localhost:5173'

export interface Profile {
  id: string
  name: string
  color: ProfileColor
  url: string
  serviceKey: string
  gameUrl: string
}

export interface ProfilesState {
  profiles: Profile[]
  activeId: string | null
}

export function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').replace(/\/(rest|auth|storage|realtime|functions)\/v1$/, '')
}

export function isLocalUrl(url: string): boolean {
  try {
    return ['127.0.0.1', 'localhost'].includes(new URL(url).hostname)
  } catch {
    return false
  }
}

export function hostOf(url: string): string {
  return URL.canParse(url) ? new URL(url).host : url
}

export function normalizeProfile(profile: Profile): Profile {
  return {
    ...profile,
    name: profile.name.trim(),
    url: normalizeUrl(profile.url),
    serviceKey: profile.serviceKey.trim(),
    gameUrl: profile.gameUrl.trim().replace(/\/+$/, ''),
  }
}

export function profileProblem(profile: Profile): string | null {
  if (profile.name.trim() === '') return 'Give the profile a name'
  if (!URL.canParse(normalizeUrl(profile.url))) return 'The Supabase URL is not valid'
  if (profile.serviceKey.trim() === '') return 'The service role key is required'
  if (!URL.canParse(profile.gameUrl.trim())) return 'The game URL is not valid'
  return null
}

export function upsertProfile(state: ProfilesState, profile: Profile): ProfilesState {
  const saved = normalizeProfile(profile)
  const exists = state.profiles.some(other => other.id === saved.id)
  return {
    profiles: exists ? state.profiles.map(other => (other.id === saved.id ? saved : other)) : [...state.profiles, saved],
    activeId: exists ? state.activeId : saved.id,
  }
}

export function removeProfile(state: ProfilesState, id: string): ProfilesState {
  const profiles = state.profiles.filter(profile => profile.id !== id)
  return { profiles, activeId: state.activeId === id ? (profiles[0]?.id ?? null) : state.activeId }
}

export function selectProfile(state: ProfilesState, id: string): ProfilesState {
  return state.profiles.some(profile => profile.id === id) ? { ...state, activeId: id } : state
}

export function activeProfile({ profiles, activeId }: ProfilesState): Profile | null {
  return profiles.find(profile => profile.id === activeId) ?? null
}

const isColor = (value: unknown): value is ProfileColor => typeof value === 'string' && value in PROFILE_COLORS

function parseProfile(value: unknown): Profile | null {
  if (typeof value !== 'object' || value === null) return null
  const { id, name, color, url, serviceKey, gameUrl } = value as Record<string, unknown>
  if (typeof id !== 'string' || typeof name !== 'string' || typeof url !== 'string' || typeof serviceKey !== 'string') return null
  return { id, name, color: isColor(color) ? color : 'slate', url, serviceKey, gameUrl: typeof gameUrl === 'string' ? gameUrl : DEFAULT_GAME_URL }
}

export function parseProfiles(raw: string | null): ProfilesState {
  try {
    const value = JSON.parse(raw ?? 'null') as { profiles?: unknown; activeId?: unknown } | null
    const profiles = Array.isArray(value?.profiles) ? value.profiles.map(parseProfile).filter(profile => profile !== null) : []
    const activeId = typeof value?.activeId === 'string' && profiles.some(profile => profile.id === value.activeId) ? value.activeId : (profiles[0]?.id ?? null)
    return { profiles, activeId }
  } catch {
    return { profiles: [], activeId: null }
  }
}

// Before several profiles existed, the only connection was stored on its own.
export function migrateLegacyConnection(raw: string | null, id: string): ProfilesState {
  try {
    const value = JSON.parse(raw ?? 'null') as { url?: unknown; serviceKey?: unknown; gameUrl?: unknown } | null
    if (typeof value?.url !== 'string' || typeof value.serviceKey !== 'string') return { profiles: [], activeId: null }
    const local = isLocalUrl(value.url)
    const profile: Profile = {
      id,
      name: local ? 'Local' : hostOf(normalizeUrl(value.url)),
      color: local ? 'green' : 'red',
      url: value.url,
      serviceKey: value.serviceKey,
      gameUrl: typeof value.gameUrl === 'string' ? value.gameUrl : DEFAULT_GAME_URL,
    }
    return { profiles: [profile], activeId: id }
  } catch {
    return { profiles: [], activeId: null }
  }
}

export function newProfile(id: string): Profile {
  return { id, name: '', color: 'green', url: DEFAULT_URL, serviceKey: '', gameUrl: DEFAULT_GAME_URL }
}
