import { AddVariantPopover } from '../AddVariantPopover'
import { CheckboxField } from './CheckboxField'
import { ColorField } from './ColorField'
import type { ModelDefinition } from '../../../../../src/scene/modelDefinitions'

type Recolor = NonNullable<ModelDefinition['recolor']>

const DEFAULT_RECOLOR = '#c0392b'

interface Props {
  recolor: Recolor | undefined
  onChange: (recolor: Recolor | undefined) => void
}

export function RecolorField({ recolor, onChange }: Props) {
  if (!recolor) return <CheckboxField label="recolor" checked={false} onChange={() => onChange({ color: DEFAULT_RECOLOR })} />

  const setVariants = (variants: Record<string, string>) => onChange({ color: recolor.color, ...(Object.keys(variants).length ? { variants } : {}) })
  const withoutVariant = (name: string) => Object.fromEntries(Object.entries(recolor.variants ?? {}).filter(([candidate]) => candidate !== name))

  return (
    <>
      <CheckboxField label="recolor" checked onChange={() => onChange(undefined)} />
      <div className="row">
        <ColorField value={recolor.color} onCommit={(color) => onChange({ ...recolor, color })} />
        {Object.entries(recolor.variants ?? {}).map(([name, color]) => (
          <div key={name}>
            {name}: <ColorField value={color} onCommit={(value) => setVariants({ ...recolor.variants, [name]: value })} />
            <button onClick={() => setVariants(withoutVariant(name))}>x</button>
          </div>
        ))}
        <AddVariantPopover onAdd={(name) => setVariants({ ...recolor.variants, [name]: recolor.color })} />
      </div>
    </>
  )
}
