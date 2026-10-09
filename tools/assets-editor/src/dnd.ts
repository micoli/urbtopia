import type { Doc } from './store/documentStore'

// Payloads carried by dnd-kit draggables and droppables.

export interface ModelDrag {
  type: 'model'
  file: string
}

export interface BuildingDrag {
  type: 'building'
  id: string
  section: string
}

export interface ModelDrop {
  type: 'model-field'
  assign: (doc: Doc, modelId: string) => Doc
}

export type DragData = ModelDrag | BuildingDrag
