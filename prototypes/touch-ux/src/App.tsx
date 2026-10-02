// PROTOTYPE: three HUD variants for the same scene, switched with ?variant=A|B|C.
import { useEffect, useState } from 'react'
import { SceneCanvas } from './SceneCanvas'
import { PrototypeSwitcher } from './PrototypeSwitcher'
import { CollectBadges } from './CollectBadges'
import { Toast } from './Toast'
import { VariantA } from './VariantA'
import { VariantB } from './VariantB'
import { VariantC } from './VariantC'

const VARIANTS = [
  { key: 'A', name: 'Top/bottom bars + bottom sheet' },
  { key: 'B', name: 'Minimal + radial menu' },
  { key: 'C', name: 'Left dock + side panel' },
]

const readVariant = () => new URLSearchParams(window.location.search).get('variant') ?? 'A'

export function App() {
  const [variant, setVariant] = useState(readVariant)
  const [longPress, setLongPress] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onPop = () => setVariant(readVariant())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <>
      <SceneCanvas onLongPress={variant === 'B' ? setLongPress : undefined} />
      <CollectBadges />
      {variant === 'A' && <VariantA />}
      {variant === 'B' && <VariantB longPress={longPress} onLongPressDone={() => setLongPress(null)} />}
      {variant === 'C' && <VariantC />}
      <Toast />
      <PrototypeSwitcher variants={VARIANTS} current={variant} />
    </>
  )
}
