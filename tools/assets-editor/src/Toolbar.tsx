import { Toolbar as RadixToolbar } from 'radix-ui'
import { ChoiceSelect } from './ChoiceSelect'

interface Props {
  packs: string[]
  pack: string
  search: string
  sourceFilter: string
  overview: boolean
  onSearch: (value: string) => void
  onSourceFilter: (value: string) => void
  onPack: (pack: string) => void
  onOverview: () => void
  onAdd: () => void
  onRotate: () => void
}

export const SOURCE_FILTERS = ['all', 'kenney', 'quaternius', 'managed', 'poly.pizza', 'other']

export function Toolbar({ packs, pack, search, sourceFilter, overview, onSearch, onSourceFilter, onPack, onOverview, onAdd, onRotate }: Props) {
  return (
    <RadixToolbar.Root id="bar" aria-label="Assets">
      <input id="global-search" type="search" placeholder="Search all assets" aria-label="Search all assets" value={search} onChange={(event) => onSearch(event.target.value)} />
      <ChoiceSelect label="Source" value={sourceFilter} options={SOURCE_FILTERS} onChange={onSourceFilter} />
      <RadixToolbar.ToggleGroup type="single" value={pack} onValueChange={(value) => value && onPack(value)} aria-label="Pack" className="packs">
        {packs.map((name) => (
          <RadixToolbar.ToggleItem key={name} value={name} className="toolbar-button">{name}</RadixToolbar.ToggleItem>
        ))}
      </RadixToolbar.ToggleGroup>
      <RadixToolbar.Button className="toolbar-button" onClick={onOverview}>{overview ? 'single' : 'overview (all in pack)'}</RadixToolbar.Button>
      <RadixToolbar.Button className="toolbar-button" onClick={onAdd}>+ add asset</RadixToolbar.Button>
      <RadixToolbar.Button className="toolbar-button" onClick={onRotate}>rotate 90 (game rotation)</RadixToolbar.Button>
    </RadixToolbar.Root>
  )
}
