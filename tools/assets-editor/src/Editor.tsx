import { useMemo, useState } from 'react'
import type { ModelDefinition, ModelSource } from '../../../src/scene/modelDefinitions'
import { MODEL_KEYS } from '../../../src/scene/renderItems'
import { AddAssetDialog } from './AddAssetDialog'
import { assetKey, defaultLicense, definitionKey, sourceOf, type Asset, type Definitions } from './assetKeys'
import { AssetList } from './AssetList'
import { callAssets, saveDefinitions } from './api'
import type { ModelInfo } from './modelLoader'
import { ModelViewer } from './ModelViewer'
import { SidePanel } from './SidePanel'
import { Toolbar } from './Toolbar'
import { useArrowNavigation } from './useArrowNavigation'

const usedInGame: ReadonlySet<string> = new Set(MODEL_KEYS)

interface Props {
  manifest: Record<string, string[]>
  sourceByPack: Record<string, ModelSource | undefined>
  initialDefinitions: Definitions
}

export function Editor({ manifest, sourceByPack, initialDefinitions }: Props) {
  const packNames = Object.keys(manifest)
  const [pack, setPack] = useState(packNames[0]!)
  const [current, setCurrent] = useState(manifest[packNames[0]!]![0] ?? '')
  const [rotation, setRotation] = useState(0)
  const [overview, setOverview] = useState(false)
  const [search, setSearch] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [definitions, setDefinitions] = useState(initialDefinitions)
  const [infos, setInfos] = useState<Record<string, ModelInfo>>({})
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)

  const sourceOfPack = (name: string) => sourceOf(name, sourceByPack)
  const matchesSourceFilter = (name: string) => sourceFilter === 'all' || (sourceOfPack(name) ?? 'other') === sourceFilter

  const results = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filter = listSearch.trim().toLowerCase()
    const assets: Asset[] = Object.entries(manifest).flatMap(([name, models]) => models.map((model) => ({ pack: name, name: model })))
    return assets.filter((asset) => (query ? matchesSourceFilter(asset.pack) && assetKey(asset.pack, asset.name).toLowerCase().includes(query) : asset.pack === pack) && asset.name.toLowerCase().includes(filter))
  }, [manifest, search, listSearch, pack, sourceFilter])

  const select = (asset: Asset) => {
    setPack(asset.pack)
    setCurrent(asset.name)
    setRotation(0)
    setOverview(false)
  }

  useArrowNavigation(results, current ? { pack, name: current } : null, overview, select)

  const key = definitionKey(pack, current)
  const source = sourceOfPack(pack)

  const commit = async (next: Definitions) => {
    setDefinitions(next)
    setMessage(await saveDefinitions(next))
  }

  const edit = (mutate: (definition: ModelDefinition) => void) => {
    if (!source) return
    const draft = structuredClone(definitions[key] ?? { source, license: defaultLicense(source) })
    mutate(draft)
    void commit({ ...definitions, [key]: draft })
  }

  const removeDefinition = () => void commit(Object.fromEntries(Object.entries(definitions).filter(([candidate]) => candidate !== key)))

  const deleteAsset = async () => {
    const error = await callAssets('remove', { key, usedKeys: [...usedInGame] })
    if (error) return setMessage(error)
    location.reload()
  }

  return (
    <div id="app">
      <Toolbar
        packs={packNames.filter(matchesSourceFilter)}
        pack={pack}
        search={search}
        sourceFilter={sourceFilter}
        overview={overview}
        onSearch={setSearch}
        onSourceFilter={setSourceFilter}
        onPack={(name) => { setPack(name); setCurrent(manifest[name]![0] ?? ''); setRotation(0) }}
        onOverview={() => setOverview(!overview)}
        onAdd={() => setAdding(true)}
        onRotate={() => setRotation((rotation + 1) % 4)}
      />
      <AssetList assets={results} selected={current ? { pack, name: current } : null} showFullKey={search.trim() !== ''} definitions={definitions} usedInGame={usedInGame} listSearch={listSearch} onListSearch={setListSearch} onSelect={select} />
      <ModelViewer
        pack={pack}
        names={manifest[pack]!}
        current={current}
        rotation={rotation}
        overview={overview}
        definitions={definitions}
        onInfo={(infoPack, name, info) => setInfos((known) => (known[assetKey(infoPack, name)] ? known : { ...known, [assetKey(infoPack, name)]: info }))}
        onPick={setCurrent}
      />
      {current ? (
        <SidePanel
          title={key}
          info={infos[assetKey(pack, current)]}
          definition={definitions[key]}
          source={source}
          usedInGame={usedInGame.has(key)}
          deletable={source === 'managed' || source === 'poly.pizza'}
          message={message}
          onEdit={edit}
          onRemoveDefinition={removeDefinition}
          onDeleteAsset={deleteAsset}
        />
      ) : (
        <div id="side">pick a model</div>
      )}
      {adding && <AddAssetDialog onClose={() => setAdding(false)} />}
    </div>
  )
}
