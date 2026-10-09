import type { BuildingDefinitions, FlatBuilding } from '../../../../src/core/buildings/buildingDefinition'
import { BuildingForm } from './BuildingForm'

export const newBuilding = (model: string, footprint: [number, number] | undefined): FlatBuilding => ({
  kind: 'standard', section: 'build.production', model, footprint: footprint ?? [1, 1], cost: 0, unlockCitizens: 0, requiresRoad: true, name: { en: '', fr: '' },
})

const uniqueId = (buildings: BuildingDefinitions) => {
  let index = 1
  while (`new-building-${index}` in buildings) index += 1
  return `new-building-${index}`
}

interface Props {
  model: string
  modelFootprint: [number, number] | undefined
  buildings: BuildingDefinitions
  onChange: (buildings: BuildingDefinitions) => void
}

export function BuildingFields({ model, modelFootprint, buildings, onChange }: Props) {
  const ids = Object.keys(buildings).filter((id) => buildings[id]!.model === model)

  const replace = (id: string, next: FlatBuilding | undefined, nextId = id) =>
    onChange(Object.fromEntries(Object.entries(buildings).flatMap(([key, definition]) => (key !== id ? [[key, definition]] : next ? [[nextId, next]] : []))))

  return (
    <>
      {ids.map((id) => (
        <BuildingForm key={id} id={id} building={buildings[id]!} onChange={(next, nextId) => replace(id, next, nextId)} />
      ))}
      <button onClick={() => onChange({ ...buildings, [uniqueId(buildings)]: newBuilding(model, modelFootprint) })}>+ building using this model</button>
    </>
  )
}
