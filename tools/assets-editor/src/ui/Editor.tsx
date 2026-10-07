import { useMemo, useState } from 'react'
import type { BuildingDefinitions } from '../../../../src/core/buildings/buildingDefinition'
import type { ModelDefinition, ModelSource } from '../../../../src/scene/modelDefinitions'
import { MODEL_KEYS } from '../../../../src/scene/renderItems'
import { AddAssetDialog } from './AddAssetDialog'
import { assetKey, defaultLicense, definitionKey, sourceOf, type Asset, type Definitions } from '../assetKeys'
import { AssetTree } from './components/AssetTree'
import { callAssets, saveBuildings, saveDefinitions } from '../api'
import type { ModelInfo } from '../modelLoader'
import { ModelViewer } from './ModelViewer'
import { SidePanel } from './SidePanel'
import { Toolbar } from './Toolbar'
import { buildTree } from '../treeModel'
import { useArrowNavigation } from '../hooks/useArrowNavigation'

const usedInGame: ReadonlySet<string> = new Set(MODEL_KEYS)

interface Props {
  manifest: Record<string, string[]>
  sourceByPack: Record<string, ModelSource | undefined>
  initialDefinitions: Definitions
  initialBuildings: BuildingDefinitions
}

export function Editor({ manifest, sourceByPack, initialDefinitions, initialBuildings }: Props) {
  const packNames = Object.keys(manifest)
  const [pack, setPack] = useState(packNames[0]!)
  const [current, setCurrent] = useState(manifest[packNames[0]!]![0] ?? '')
  const [rotation, setRotation] = useState(0)
  const [overview, setOverview] = useState(false)
  const [filter, setFilter] = useState('')
  const [expandedSources, setExpandedSources] = useState(() => [sourceOf(packNames[0]!, sourceByPack) ?? 'other'])
  const [expandedPacks, setExpandedPacks] = useState([packNames[0]!])
  const [definitions, setDefinitions] = useState(initialDefinitions)
  const [buildings, setBuildings] = useState(initialBuildings)
  const [infos, setInfos] = useState<Record<string, ModelInfo>>({})
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)

  const sourceOfPack = (name: string) => sourceOf(name, sourceByPack)
  const searching = filter.trim() !== ''
  const sources = useMemo(() => buildTree(manifest, sourceByPack, filter), [manifest, sourceByPack, filter])
  const openSources = searching ? sources.map((node) => node.id) : expandedSources
  const openPacks = searching ? sources.flatMap((node) => node.packs.map(({ pack: name }) => name)) : expandedPacks

  const results = useMemo(
    () => sources.filter((node) => openSources.includes(node.id)).flatMap((node) => node.packs.filter((entry) => openPacks.includes(entry.pack) || node.packs.length === 1 && entry.pack === node.id).flatMap((entry) => entry.assets)),
    [sources, openSources.join('\n'), openPacks.join('\n')],
  )

  const select = (asset: Asset) => {
    setPack(asset.pack)
    setCurrent(asset.name)
    setRotation(0)
    setOverview(false)
    const assetSource = sourceOfPack(asset.pack) ?? 'other'
    setExpandedSources((known) => (known.includes(assetSource) ? known : [...known, assetSource]))
    setExpandedPacks((known) => (known.includes(asset.pack) ? known : [...known, asset.pack]))
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

  const commitBuildings = async (next: BuildingDefinitions) => {
    setBuildings(next)
    setMessage(await saveBuildings(next))
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
          overview={overview}
          onOverviewChange={setOverview}
          onAdd={() => setAdding(true)}
          onMinusRotate={() => setRotation((rotation - 1) % 4)}
          onPlusRotate={() => setRotation((rotation + 1) % 4)}
      />
      <AssetTree
        sources={sources}
        expandedSources={openSources}
        expandedPacks={openPacks}
        selected={current ? { pack, name: current } : null}
        definitions={definitions}
        usedInGame={usedInGame}
        filter={filter}
        onFilter={setFilter}
        onExpandedSources={(next) => !searching && setExpandedSources(next)}
        onExpandedPacks={(next) => !searching && setExpandedPacks(next)}
        onSelect={select}
      />
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
          buildings={buildings}
          onBuildingsChange={(next) => void commitBuildings(next)}
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
