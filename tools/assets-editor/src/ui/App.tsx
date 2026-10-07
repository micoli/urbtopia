import { useEffect, useState } from 'react'
import type { ModelSource } from '../../../../src/scene/modelDefinitions'
import type { BuildingDefinitions } from '../../../../src/core/buildings/buildingDefinition'
import type { Definitions } from '../assetKeys'
import { fetchBuildings, fetchDefinitions, fetchManifest, fetchSourceByPack } from '../api'
import { Editor } from './Editor'

interface Catalog {
  manifest: Record<string, string[]>
  sourceByPack: Record<string, ModelSource | undefined>
  definitions: Definitions
  buildings: BuildingDefinitions
}

export function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)

  useEffect(() => {
    void Promise.all([fetchManifest(), fetchSourceByPack(), fetchDefinitions(), fetchBuildings()]).then(([manifest, sourceByPack, definitions, buildings]) => setCatalog({ manifest, sourceByPack, definitions, buildings }))
  }, [])

  if (!catalog) return <div id="side">loading</div>
  return <Editor manifest={catalog.manifest} sourceByPack={catalog.sourceByPack} initialDefinitions={catalog.definitions} initialBuildings={catalog.buildings} />
}
