const HANDLE_FORMAT = /^[A-Za-z0-9_-]{3,20}$/

export function isValidHandle(handle: string): boolean {
  return HANDLE_FORMAT.test(handle)
}

export function neutralHandle(userId: string): string {
  return `player-${userId.replace(/-/g, '').slice(0, 8)}`
}
