import { useEffect, useState } from 'react'
import { ImportDialog } from './ImportDialog'

const carriesAsset = (event: DragEvent) => [...(event.dataTransfer?.types ?? [])].includes('Files')

// Native drops of files from the desktop open the import flow; dnd-kit drags inside the page are not native.
export function FileDropZone() {
  const [hovering, setHovering] = useState(false)
  const [dropped, setDropped] = useState<File | null>(null)

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
      if (file && /\.(glb|zip)$/i.test(file.name)) setDropped(file)
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
          <p className="text-lg font-semibold text-indigo-700">Drop a GLB or a zip to import it</p>
        </div>
      )}
      {dropped && <ImportDialog initialFile={dropped} onClose={() => setDropped(null)} />}
    </>
  )
}
