import type { CollectionName } from '../../../scripts/collections'
import type { Doc } from './store/documentStore'

// Payloads carried by dnd-kit draggables and droppables.

export interface ModelDrag {
  type: 'model'
  file: string
}

export interface DefinitionDrag {
  type: 'definition'
  collection: CollectionName
  id: string
}

export interface ModelDrop {
  type: 'model-field'
  assign: (doc: Doc, modelId: string) => Doc
}

export type DragData = ModelDrag | DefinitionDrag
