import { create } from 'zustand'
import { migrateLegacyConnection, parseProfiles, removeProfile, selectProfile, upsertProfile, type Profile, type ProfilesState } from '../domain/profiles'

const STORAGE_KEY = 'back-office:profiles'
const LEGACY_KEY = 'back-office:connection'

const read = (): ProfilesState => {
  try {
    const stored = parseProfiles(localStorage.getItem(STORAGE_KEY))
    if (stored.profiles.length > 0) return stored
    const migrated = migrateLegacyConnection(localStorage.getItem(LEGACY_KEY), crypto.randomUUID())
    if (migrated.profiles.length > 0) write(migrated)
    return migrated
  } catch {
    return { profiles: [], activeId: null }
  }
}

const write = (state: ProfilesState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // The profiles then last for this page only.
  }
}

interface ProfilesStore extends ProfilesState {
  save: (profile: Profile) => void
  remove: (id: string) => void
  select: (id: string) => void
}

export const useProfiles = create<ProfilesStore>()((set, get) => {
  const apply = (next: ProfilesState) => {
    write(next)
    set(next)
  }
  return {
    ...read(),
    save: profile => apply(upsertProfile(get(), profile)),
    remove: id => apply(removeProfile(get(), id)),
    select: id => apply(selectProfile(get(), id)),
  }
})
