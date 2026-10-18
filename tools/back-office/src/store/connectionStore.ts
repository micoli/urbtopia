import { create } from 'zustand'

export interface Connection {
  url: string
  serviceKey: string
  gameUrl: string
}

const STORAGE_KEY = 'back-office:connection'
export const DEFAULT_URL = 'http://127.0.0.1:54321'
export const DEFAULT_GAME_URL = 'http://localhost:5173'

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

const read = (): Connection | null => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Connection> | null
    if (typeof value?.url !== 'string' || typeof value.serviceKey !== 'string') return null
    return { url: value.url, serviceKey: value.serviceKey, gameUrl: typeof value.gameUrl === 'string' ? value.gameUrl : DEFAULT_GAME_URL }
  } catch {
    return null
  }
}

const write = (connection: Connection | null) => {
  try {
    if (connection) localStorage.setItem(STORAGE_KEY, JSON.stringify(connection))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // The connection then lasts for this page only.
  }
}

interface ConnectionState {
  connection: Connection | null
  connect: (connection: Connection) => void
  forget: () => void
}

export const useConnection = create<ConnectionState>()(set => ({
  connection: read(),
  connect: connection => {
    const normalized = { ...connection, url: normalizeUrl(connection.url), serviceKey: connection.serviceKey.trim(), gameUrl: connection.gameUrl.trim().replace(/\/+$/, '') }
    write(normalized)
    set({ connection: normalized })
  },
  forget: () => {
    write(null)
    set({ connection: null })
  },
}))
