import { ColorField } from './ColorField'
import type { ModelDefinition } from '../../../src/scene/modelDefinitions'

type Recolor = NonNullable<ModelDefinition['recolor']>

const DEFAULT_RECOLOR = '#c0392b'

interface Props {
  recolor: Recolor | undefined
  onChange: (recolor: Recolor | undefined) => void
}

export function RecolorField({ recolor, onChange }: Props) {
  if (!recolor) {
    return (
      <div className="row">
        recolor: <input type="checkbox" checked={false} onChange={() => onChange({ color: DEFAULT_RECOLOR })} />
      </div>
    )
  }

  const setVariants = (variants: Record<string, string>) => onChange({ color: recolor.color, ...(Object.keys(variants).length ? { variants } : {}) })
  const addVariant = () => {
    const name = prompt('Variant name')?.trim()
    if (name) setVariants({ ...recolor.variants, [name]: recolor.color })
  }

  return (
    <div className="row">
      recolor: <input type="checkbox" checked onChange={() => onChange(undefined)} />
      <ColorField value={recolor.color} onCommit={(color) => onChange({ ...recolor, color })} />
      {Object.entries(recolor.variants ?? {}).map(([name, color]) => (
        <div key={name}>
          {name}: <ColorField value={color} onCommit={(value) => setVariants({ ...recolor.variants, [name]: value })} />
          <button onClick={() => setVariants(Object.fromEntries(Object.entries(recolor.variants ?? {}).filter(([candidate]) => candidate !== name)))}>x</button>
        </div>
      ))}
      <button onClick={addVariant}>+ variant</button>
    </div>
  )
}
