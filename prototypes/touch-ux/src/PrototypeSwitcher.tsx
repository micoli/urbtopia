import { useEffect } from 'react'

type Props = { variants: { key: string; name: string }[]; current: string }

function setVariant(key: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('variant', key)
  window.history.replaceState(null, '', url)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function PrototypeSwitcher({ variants, current }: Props) {
  const index = variants.findIndex(v => v.key === current)
  const step = (d: number) => setVariant(variants[(index + d + variants.length) % variants.length].key)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, [contenteditable]')) return
      if (e.key === 'ArrowLeft' && e.shiftKey) step(-1)
      if (e.key === 'ArrowRight' && e.shiftKey) step(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (import.meta.env.PROD) return null
  return (
    <div className="switcher">
      <button onClick={() => step(-1)} aria-label="Previous variant">←</button>
      <span>{current} ({variants[index].name})</span>
      <button onClick={() => step(1)} aria-label="Next variant">→</button>
    </div>
  )
}
