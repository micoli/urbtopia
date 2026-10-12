import { useRef } from 'react'

interface Props {
  orientation: 'vertical' | 'horizontal'
  label: string
  // Called with the pointer travel in pixels along the axis the splitter moves on.
  onResize: (delta: number) => void
  onReset: () => void
}

const KEY_STEP = 16

// A bar between two panels: drag it, use the arrow keys, or double-click to restore the default size.
export function Splitter({ orientation, label, onResize, onReset }: Props) {
  const last = useRef<number | null>(null)
  const vertical = orientation === 'vertical'
  const at = (event: React.PointerEvent) => (vertical ? event.clientX : event.clientY)
  const keys = vertical ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown']

  return (
    <div
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-label={label}
      tabIndex={0}
      className={`group hidden touch-none items-center justify-center outline-none lg:flex ${vertical ? 'cursor-col-resize' : 'cursor-row-resize'}`}
      onPointerDown={event => {
        event.currentTarget.setPointerCapture(event.pointerId)
        last.current = at(event)
      }}
      onPointerMove={event => {
        if (last.current === null) return
        const position = at(event)
        onResize(position - last.current)
        last.current = position
      }}
      onPointerUp={() => {
        last.current = null
      }}
      onDoubleClick={onReset}
      onKeyDown={event => {
        const direction = keys.indexOf(event.key)
        if (direction < 0) return
        event.preventDefault()
        onResize((direction === 0 ? -1 : 1) * KEY_STEP)
      }}
    >
      <div className={`rounded-full bg-zinc-300 transition-colors group-hover:bg-indigo-500 group-focus-visible:bg-indigo-500 group-active:bg-indigo-500 dark:bg-zinc-700 ${vertical ? 'h-12 w-1' : 'h-1 w-12'}`} />
    </div>
  )
}
