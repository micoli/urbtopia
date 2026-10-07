import { ScrollArea } from 'radix-ui'
import { useEffect, useRef } from 'react'
import { assetKey, definitionKey, type Asset, type Definitions } from './assetKeys'

interface Props {
  assets: Asset[]
  selected: Asset | null
  showFullKey: boolean
  definitions: Definitions
  usedInGame: ReadonlySet<string>
  listSearch: string
  onListSearch: (value: string) => void
  onSelect: (asset: Asset) => void
}

export function AssetList({ assets, selected, showFullKey, definitions, usedInGame, listSearch, onListSearch, onSelect }: Props) {
  const selectedRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <div id="assets">
      <input id="list-search" type="search" placeholder="Filter this pack" aria-label="Filter this pack" value={listSearch} onChange={(event) => onListSearch(event.target.value)} />
      <ScrollArea.Root className="scroll-root">
        <ScrollArea.Viewport id="list" tabIndex={0} aria-label="Assets" className="scroll-viewport">
          {assets.length === 0 && 'No assets found'}
          {assets.map((asset) => {
            const key = definitionKey(asset.pack, asset.name)
            const isSelected = asset.pack === selected?.pack && asset.name === selected.name
            const isDefined = !!definitions[key]
            return (
              <div key={assetKey(asset.pack, asset.name)} ref={isSelected ? selectedRef : undefined} className={`asset-row ${isSelected ? 'sel ' : ''}${isDefined ? 'done' : ''}`} onClick={() => onSelect(asset)}>
                <span>{showFullKey ? assetKey(asset.pack, asset.name) : asset.name}{usedInGame.has(key) ? ' (*)' : ''}</span>
                {isDefined ? 'defined' : ''}
              </div>
            )
          })}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" className="scrollbar">
          <ScrollArea.Thumb className="scrollbar-thumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  )
}
