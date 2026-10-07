import { useEffect, useState } from 'react'
import type { ModelSource } from '../../../../src/scene/modelDefinitions'
import type { Definitions } from '../assetKeys'
import { fetchDefinitions, fetchManifest, fetchSourceByPack } from '../api'
import { Editor } from './Editor'

interface Catalog {
  manifest: Record<string, string[]>
  sourceByPack: Record<string, ModelSource | undefined>
  definitions: Definitions
}

export function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)

  useEffect(() => {
    void Promise.all([fetchManifest(), fetchSourceByPack(), fetchDefinitions()]).then(([manifest, sourceByPack, definitions]) => setCatalog({ manifest, sourceByPack, definitions }))
  }, [])

  if (!catalog) return <div id="side">loading</div>
  return <Editor manifest={catalog.manifest} sourceByPack={catalog.sourceByPack} initialDefinitions={catalog.definitions} />
}
