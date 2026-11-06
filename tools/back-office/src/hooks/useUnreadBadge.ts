import { useEffect } from 'react'
import { badgeLabel, badgedTitle } from '../domain/unreadBadge'

const FAVICON_SIZE = 64
const BASE_TITLE = document.title

function faviconLink(): HTMLLinkElement {
  const existing = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (existing) return existing
  const link = document.createElement('link')
  link.rel = 'icon'
  document.head.append(link)
  return link
}

function badgeFavicon(unread: number): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = FAVICON_SIZE
  canvas.height = FAVICON_SIZE
  const context = canvas.getContext('2d')
  if (!context) return null
  context.fillStyle = '#4f46e5'
  context.beginPath()
  context.arc(32, 32, 30, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#dc2626'
  context.beginPath()
  context.arc(44, 20, 20, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#ffffff'
  context.font = 'bold 26px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(badgeLabel(unread), 44, 21, 34)
  return canvas.toDataURL('image/png')
}

export function useUnreadBadge(unread: number): void {
  useEffect(() => {
    const link = faviconLink()
    const original = link.href
    document.title = badgedTitle(BASE_TITLE, unread)
    if (unread > 0) {
      const badge = badgeFavicon(unread)
      if (badge) link.href = badge
    }
    return () => {
      document.title = BASE_TITLE
      if (original) link.href = original
      else link.removeAttribute('href')
    }
  }, [unread])
}
