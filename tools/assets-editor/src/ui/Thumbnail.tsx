import { useEffect, useRef, useState } from 'react'
import { useLibrary } from '../hooks/useLibrary'
import { thumbnailOf } from '../library/thumbnails'
import { useDocument } from '../store/documentStore'

interface Props {
  file: string | undefined
  className?: string
}

// Drawn only once the image scrolls into view: the library holds thousands of models.
export function Thumbnail({ file, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [url, setUrl] = useState('')
  const location = useLibrary().byFile.get(file ?? '')
  const settings = useDocument(state => (location?.id ? state.doc.models[location.id] : undefined))

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => entry?.isIntersecting && setVisible(true), { rootMargin: '200px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || !location) return
    let live = true
    void thumbnailOf(location.file, location.pack, location.name, settings).then(image => live && setUrl(image))
    return () => {
      live = false
    }
  }, [visible, location, settings])

  return (
    <div ref={ref} className={`flex items-center justify-center overflow-hidden rounded-md bg-gradient-to-b from-zinc-50 to-zinc-200 ${className ?? ''}`}>
      {url ? <img src={url} alt="" className="h-full w-full object-contain" draggable={false} /> : <span className="text-[10px] text-zinc-400">{location ? '…' : '?'}</span>}
    </div>
  )
}
