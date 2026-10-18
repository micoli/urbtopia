export function formatDate(value: string | number | null): string {
  if (value === null) return '—'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function formatNumber(value: number): string {
  return value.toLocaleString()
}
