import { definitionKey, type Asset, type Definitions } from '../../assetKeys'
import { AssetRow } from './AssetRow'

export interface RowsContext {
  selected: Asset | null
  definitions: Definitions
  usedInGame: ReadonlySet<string>
  onSelect: (asset: Asset) => void
}

interface Props extends RowsContext {
  assets: Asset[]
}

export function AssetRows({ assets, selected, definitions, usedInGame, onSelect }: Props) {
  return assets.map((asset) => {
    const key = definitionKey(asset.pack, asset.name)
    return (
      <AssetRow
        key={asset.name}
        name={asset.name}
        selected={asset.pack === selected?.pack && asset.name === selected.name}
        defined={!!definitions[key]}
        usedInGame={usedInGame.has(key)}
        onSelect={() => onSelect(asset)}
      />
    )
  })
}
