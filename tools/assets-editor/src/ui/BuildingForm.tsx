import type { BuildingKind, FlatBuilding, LocalizedText } from '../../../../src/core/buildings/buildingDefinition'
import { BUILD_SECTION_TITLES } from '../../../../src/core/buildings/buildSections'
import { NATURE_FAMILIES, type NatureFamily } from '../../../../src/core/environment/natureFamilies'
import { CheckboxField } from './components/CheckboxField'
import { ChoiceSelect } from './components/ChoiceSelect'
import { NumberField } from './components/NumberField'
import { TextField } from './components/TextField'

const KINDS: readonly BuildingKind[] = ['standard', 'sport', 'nature']
const FAMILIES = Object.keys(NATURE_FAMILIES)
const blank: LocalizedText = { en: '', fr: '' }

function asKind(building: FlatBuilding, kind: BuildingKind): FlatBuilding {
  const { model, name, description, footprint } = building
  const common = { model, name, ...(description ? { description } : {}) }
  if (kind === 'nature') return { kind, ...common, family: 'decoration' }
  const placed = { section: building.section ?? BUILD_SECTION_TITLES[0], footprint: footprint ?? [1, 1], cost: building.cost ?? 0, unlockCitizens: building.unlockCitizens ?? 0, requiresRoad: building.requiresRoad ?? true, ...(building.accessModes ? { accessModes: building.accessModes } : {}) } satisfies Partial<FlatBuilding>
  return kind === 'sport' ? { kind, ...common, ...placed, section: 'build.sport', radius: 1, wellbeingBonus: 0 } : { kind, ...common, ...placed }
}

interface Props {
  id: string
  building: FlatBuilding
  onChange: (building: FlatBuilding | undefined, id?: string) => void
}

export function BuildingForm({ id, building, onChange }: Props) {
  const change = (patch: Partial<FlatBuilding>) => onChange({ ...building, ...patch })
  const withName = (language: keyof LocalizedText) => (value: string) => change({ name: { ...building.name, [language]: value } })
  const withDescription = (language: keyof LocalizedText) => (value: string) => change({ description: { ...(building.description ?? blank), [language]: value } })
  const withNumber = (field: 'cost' | 'unlockCitizens' | 'initialSlots') => (value: number | undefined) => change({ [field]: value ?? 0 })
  const footprint = building.footprint ?? [1, 1]

  return (
    <fieldset>
      <legend>Building</legend>
      <ChoiceSelect label="Kind" value={building.kind} options={KINDS} onChange={(next) => onChange(asKind(building, next as BuildingKind))} />
      <TextField label="Id" value={id} onCommit={(next) => onChange(building, next)} />
      <TextField label="Name (en)" value={building.name.en} onCommit={withName('en')} />
      <TextField label="Name (fr)" value={building.name.fr} onCommit={withName('fr')} />
      {building.kind === 'nature' ? (
        <ChoiceSelect label="Family" value={building.family ?? 'decoration'} options={FAMILIES} onChange={(family) => change({ family: family as NatureFamily })} />
      ) : (
        <>
          <ChoiceSelect label="Section" value={building.section ?? BUILD_SECTION_TITLES[0]} options={BUILD_SECTION_TITLES} onChange={(section) => change({ section: section as FlatBuilding['section'] })} />
          <TextField label="Description (en)" value={building.description?.en ?? ''} onCommit={withDescription('en')} />
          <TextField label="Description (fr)" value={building.description?.fr ?? ''} onCommit={withDescription('fr')} />
          <NumberField label="Footprint W" value={footprint[0]} onCommit={(width) => change({ footprint: [width ?? 1, footprint[1]] })} />
          <NumberField label="Footprint D" value={footprint[1]} onCommit={(depth) => change({ footprint: [footprint[0], depth ?? 1] })} />
          <NumberField label="Cost (Urbs)" value={building.cost} onCommit={withNumber('cost')} />
          <NumberField label="Unlock (Citizens)" value={building.unlockCitizens} onCommit={withNumber('unlockCitizens')} />
          <NumberField label="Initial slots" value={building.initialSlots} placeholder="0" onCommit={(value) => change({ initialSlots: value || undefined })} />
          <CheckboxField label="Requires road" checked={building.requiresRoad ?? true} onChange={(requiresRoad) => change({ requiresRoad, ...(requiresRoad ? {} : { accessModes: undefined }) })} />
          {(building.requiresRoad ?? true) && <CheckboxField label="BRT compatible" checked={building.accessModes?.includes('brt') ?? false} onChange={(brt) => change({ accessModes: brt ? ['road', 'brt'] : undefined })} />}
        </>
      )}
      {building.kind === 'sport' && (
        <>
          <NumberField label="Radius (tiles)" value={building.radius} onCommit={(radius) => change({ radius: radius ?? 1 })} />
          <NumberField label="Well-being bonus" value={building.wellbeingBonus} onCommit={(bonus) => change({ wellbeingBonus: bonus ?? 0 })} />
        </>
      )}
      <button onClick={() => onChange(undefined)}>remove building</button>
    </fieldset>
  )
}
