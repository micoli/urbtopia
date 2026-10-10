import { useEffect, useRef } from 'react'
import { useDocument } from '../store/documentStore'

const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

// Cmd+S saves everywhere; undo and redo leave a focused field to the browser.
export function useShortcuts(save: () => void): void {
  const saveRef = useRef(save)
  saveRef.current = save

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      const key = event.key.toLowerCase()
      if (key === 's') {
        event.preventDefault()
        saveRef.current()
        return
      }
      if (isTyping(event.target)) return
      const { undo, redo } = useDocument.getState()
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      }
      if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
