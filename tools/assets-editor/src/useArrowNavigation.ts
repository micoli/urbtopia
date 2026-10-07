import { useEffect, useRef } from 'react'
import type { Asset } from './assetKeys'

const isTextTarget = (target: HTMLElement) => target.closest('input, select, textarea, [contenteditable], [role=combobox], [role=listbox]') !== null
const isSearchBox = (target: HTMLElement) => target.id === 'global-search' || target.id === 'list-search'

export function useArrowNavigation(results: Asset[], selected: Asset | null, overview: boolean, onSelect: (asset: Asset) => void) {
  const latest = useRef({ results, selected, overview, onSelect })
  latest.current = { results, selected, overview, onSelect }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      const target = event.target as HTMLElement
      if (!isSearchBox(target) && isTextTarget(target)) return
      const { results, selected, overview, onSelect } = latest.current
      if (!results.length) return
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      const index = results.findIndex((asset) => asset.pack === selected?.pack && asset.name === selected.name)
      const next = index < 0 ? (step === 1 ? 0 : results.length - 1) : Math.max(0, Math.min(results.length - 1, index + step))
      if (index === next && !overview) return
      onSelect(results[next]!)
      if (isSearchBox(target)) target.focus()
    }
    addEventListener('keydown', onKeyDown)
    return () => removeEventListener('keydown', onKeyDown)
  }, [])
}
