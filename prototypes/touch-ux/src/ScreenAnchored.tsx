import { useEffect, useRef, type ReactNode } from 'react'
import { sceneHandle } from './sceneHandle'

type Props = { buildingId: number; offsetY?: number; className?: string; children: ReactNode }

export function ScreenAnchored({ buildingId, offsetY = 0, className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let unsubscribe = () => {}
    const attach = () => {
      const scene = sceneHandle.current
      if (!scene) return void requestAnimationFrame(attach)
      unsubscribe = scene.subscribeFrame(() => {
        const el = ref.current
        const p = scene.project(buildingId)
        if (!el || !p) return
        el.style.display = p.visible ? '' : 'none'
        el.style.transform = `translate(${p.x}px, ${p.y + offsetY}px) translate(-50%, -100%)`
      })
    }
    attach()
    return () => unsubscribe()
  }, [buildingId, offsetY])

  return <div ref={ref} className={`anchored ${className ?? ''}`}>{children}</div>
}
