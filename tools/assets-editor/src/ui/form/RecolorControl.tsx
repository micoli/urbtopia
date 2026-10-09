import type { ModelEntry } from '../../../../../src/core/models/modelSchema'
import { AddVariantPopover } from '../AddVariantPopover'
import { ColorField } from '../components/ColorField'
import { SwitchControl } from './SwitchControl'

type Recolor = NonNullable<ModelEntry['recolor']>

const DEFAULT_RECOLOR = '#c0392b'

interface Props {
  recolor: Recolor | undefined
  onChange: (recolor: Recolor | undefined) => void
}

export function RecolorControl({ recolor, onChange }: Props) {
  if (!recolor) return <SwitchControl checked={false} label="Recolor" onChange={() => onChange({ color: DEFAULT_RECOLOR })} />

  const setVariants = (variants: Record<string, string>) => onChange({ color: recolor.color, ...(Object.keys(variants).length ? { variants } : {}) })
  const withoutVariant = (name: string) => Object.fromEntries(Object.entries(recolor.variants ?? {}).filter(([candidate]) => candidate !== name))

  return (
    <div className="flex flex-col gap-2">
      <SwitchControl checked label="Recolor" onChange={() => onChange(undefined)} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          base <ColorField value={recolor.color} onCommit={color => onChange({ ...recolor, color })} />
        </label>
        {Object.entries(recolor.variants ?? {}).map(([name, color]) => (
          <span key={name} className="flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-1 text-xs text-zinc-600 ring-1 ring-zinc-200">
            {name}
            <ColorField value={color} onCommit={value => setVariants({ ...recolor.variants, [name]: value })} />
            <button className="text-zinc-400 hover:text-red-600" aria-label={`Remove ${name}`} onClick={() => setVariants(withoutVariant(name))}>×</button>
          </span>
        ))}
        <AddVariantPopover onAdd={name => setVariants({ ...recolor.variants, [name]: recolor.color })} />
      </div>
    </div>
  )
}
