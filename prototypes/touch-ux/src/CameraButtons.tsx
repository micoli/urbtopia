import { sceneHandle } from './sceneHandle'

export function CameraButtons({ className = '' }: { className?: string }) {
  return (
    <div className={`camera-buttons ${className}`}>
      <button onClick={() => sceneHandle.current?.rotateStep(-1)} aria-label="Rotate left">⟲</button>
      <button onClick={() => sceneHandle.current?.rotateStep(1)} aria-label="Rotate right">⟳</button>
      <button onClick={() => sceneHandle.current?.zoomBy(1.3)} aria-label="Zoom in">＋</button>
      <button onClick={() => sceneHandle.current?.zoomBy(1 / 1.3)} aria-label="Zoom out">－</button>
    </div>
  )
}
