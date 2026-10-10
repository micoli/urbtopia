import { useEffect, useState } from 'react'
import { ImportDialog } from './ImportDialog'

interface Dropped {
  file?: File
  url?: string
}

const carriesAsset = (event: DragEvent) => [...(event.dataTransfer?.types ?? [])].some(type => type === 'Files' || type === 'text/uri-list')

// Native drops (files from the desktop, links from a browser) open the import flow; dnd-kit drags inside the page are not native.
export function FileDropZone() {
  const [hovering, setHovering] = useState(false)
  const [dropped, setDropped] = useState<Dropped | null>(null)

  useEffect(() => {
    let depth = 0
    const onEnter = (event: DragEvent) => {
      if (!carriesAsset(event)) return
      depth += 1
      setHovering(true)
    }
    const onLeave = () => {
      depth = Math.max(0, depth - 1)
      if (!depth) setHovering(false)
    }
    const onOver = (event: DragEvent) => carriesAsset(event) && event.preventDefault()
    const onDrop = (event: DragEvent) => {
      if (!carriesAsset(event)) return
      event.preventDefault()
      depth = 0
      setHovering(false)
      const file = event.dataTransfer?.files[0]
      const url = event.dataTransfer?.getData('text/uri-list') || event.dataTransfer?.getData('text/plain')
      if (file && /\.(glb|zip)$/i.test(file.name)) return setDropped({ file })
      if (url?.includes('poly.pizza')) setDropped({ url: url.trim() })
    }
    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('dragover', onOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('dragover', onOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [])

  return (
    <>
      {hovering && (
        <div className="pointer-events-none fixed inset-3 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-500 bg-indigo-50/80">
          <p className="text-lg font-semibold text-indigo-700">Drop a GLB, a zip or a Poly Pizza link to import it</p>
        </div>
      )}
      {dropped && <ImportDialog initialFile={dropped.file} initialUrl={dropped.url} onClose={() => setDropped(null)} />}
    </>
  )
}
