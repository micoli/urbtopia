import * as THREE from 'three'
import type { PuzzleBoardScene } from '../../../src/scene/puzzle/PuzzleBoardScene'

const AXES = [
  { label: 'X', vector: new THREE.Vector3(1, 0, 0), color: '#e5484d' },
  { label: 'Y', vector: new THREE.Vector3(0, 1, 0), color: '#46a758' },
  { label: 'Z', vector: new THREE.Vector3(0, 0, 1), color: '#3e63dd' },
]
const TURN_PER_PIXEL = 0.01

// Draws the axes of the world as the camera sees them, turns the camera when dragged, and tells its three angles.
export function startGizmo(board: PuzzleBoardScene, canvas: HTMLCanvasElement, readout: HTMLOutputElement) {
  const context = canvas.getContext('2d')
  if (!context) return
  const size = canvas.width
  const centre = size / 2
  const reach = size * 0.36
  let last: { x: number; y: number } | undefined

  canvas.addEventListener('pointerdown', (event) => {
    last = { x: event.clientX, y: event.clientY }
    canvas.setPointerCapture(event.pointerId)
  })
  canvas.addEventListener('pointermove', (event) => {
    if (!last) return
    board.turnCamera((event.clientX - last.x) * TURN_PER_PIXEL, (event.clientY - last.y) * TURN_PER_PIXEL)
    last = { x: event.clientX, y: event.clientY }
  })
  const release = () => { last = undefined }
  canvas.addEventListener('pointerup', release)
  canvas.addEventListener('pointercancel', release)

  const draw = () => {
    const inverse = board.cameraOrientation().invert()
    const projected = AXES.map((axis) => ({ ...axis, view: axis.vector.clone().applyQuaternion(inverse) }))
    projected.sort((a, b) => a.view.z - b.view.z)
    context.clearRect(0, 0, size, size)
    context.fillStyle = 'rgba(128,128,128,0.15)'
    context.beginPath()
    context.arc(centre, centre, centre - 2, 0, Math.PI * 2)
    context.fill()
    context.lineWidth = 5
    context.lineCap = 'round'
    context.font = 'bold 26px system-ui'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    for (const { label, color, view } of projected) {
      const x = centre + view.x * reach
      const y = centre - view.y * reach
      context.globalAlpha = view.z < -0.05 ? 0.45 : 1
      context.strokeStyle = color
      context.beginPath()
      context.moveTo(centre, centre)
      context.lineTo(x, y)
      context.stroke()
      context.fillStyle = color
      context.beginPath()
      context.arc(x, y, 15, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#fff'
      context.fillText(label, x, y + 1)
    }
    context.globalAlpha = 1
    const { yaw, pitch, roll } = board.cameraAngles()
    const offset = board.cameraOffset()
    readout.textContent = `yaw   ${yaw.toFixed(1)}°\npitch ${pitch.toFixed(1)}°\nroll  ${roll.toFixed(1)}°\nx     ${offset.x.toFixed(2)}\ny     ${offset.y.toFixed(2)}`
    requestAnimationFrame(draw)
  }
  draw()
}
