import type { BuildingDefinition, LocalizedText } from '../../../../src/core/buildings/buildingDefinition'
import { BUILD_SECTION_TITLES } from '../../../../src/core/buildings/buildSections'
import { NATURE_FAMILIES, type NatureFamily } from '../../../../src/core/environment/natureFamilies'
import { CheckboxField } from './components/CheckboxField'
import { ChoiceSelect } from './components/ChoiceSelect'
import { NumberField } from './components/NumberField'
import { TextField } from './components/TextField'

type Kind = 'standard' | 'sport' | 'nature'

const KINDS: readonly Kind[] = ['standard', 'sport', 'nature']
const FAMILIES = Object.keys(NATURE_FAMILIES)
const blank: LocalizedText = { en: '', fr: '' }

const kindOf = (building: BuildingDefinition): Kind => (building.nature ? 'nature' : building.sport ? 'sport' : 'standard')

function asKind(building: BuildingDefinition, kind: Kind): BuildingDefinition {
  const { model, name, description, footprint } = building
  const common = { model, name, ...(description ? { description } : {}) }
  if (kind === 'nature') return { ...common, nature: { family: 'decoration' } }
  const placed = { section: building.section ?? BUILD_SECTION_TITLES[0], footprint: footprint ?? [1, 1], cost: building.cost ?? 0, unlockCitizens: building.unlockCitizens ?? 0, requiresRoad: building.requiresRoad ?? true }
  return kind === 'sport' ? { ...common, ...placed, section: 'build.sport', sport: { radius: 1, wellbeingBonus: 0 } } : { ...common, ...placed }
}

interface Props {
  id: string
  building: BuildingDefinition
  onChange: (building: BuildingDefinition | undefined, id?: string) => void
}

export function BuildingForm({ id, building, onChange }: Props) {
  const kind = kindOf(building)
  const change = (patch: Partial<BuildingDefinition>) => onChange({ ...building, ...patch })
  const withName = (language: keyof LocalizedText) => (value: string) => change({ name: { ...building.name, [language]: value } })
  const withDescription = (language: keyof LocalizedText) => (value: string) => change({ description: { ...(building.description ?? blank), [language]: value } })
  const withNumber = (field: 'cost' | 'unlockCitizens' | 'initialSlots') => (value: number | undefined) => change({ [field]: value ?? 0 })
  const footprint = building.footprint ?? [1, 1]

  return (
    <fieldset>
      <legend>Building</legend>
      <ChoiceSelect label="Kind" value={kind} options={KINDS} onChange={(next) => onChange(asKind(building, next as Kind))} />
      <TextField label="Id" value={id} onCommit={(next) => onChange(building, next)} />
      <TextField label="Name (en)" value={building.name.en} onCommit={withName('en')} />
      <TextField label="Name (fr)" value={building.name.fr} onCommit={withName('fr')} />
      {building.nature ? (
        <ChoiceSelect label="Family" value={building.nature.family} options={FAMILIES} onChange={(family) => change({ nature: { family: family as NatureFamily } })} />
      ) : (
        <>
          <ChoiceSelect label="Section" value={building.section ?? BUILD_SECTION_TITLES[0]} options={BUILD_SECTION_TITLES} onChange={(section) => change({ section: section as BuildingDefinition['section'] })} />
          <TextField label="Description (en)" value={building.description?.en ?? ''} onCommit={withDescription('en')} />
          <TextField label="Description (fr)" value={building.description?.fr ?? ''} onCommit={withDescription('fr')} />
          <NumberField label="Footprint W" value={footprint[0]} onCommit={(width) => change({ footprint: [width ?? 1, footprint[1]] })} />
          <NumberField label="Footprint D" value={footprint[1]} onCommit={(depth) => change({ footprint: [footprint[0], depth ?? 1] })} />
          <NumberField label="Cost (Urbs)" value={building.cost} onCommit={withNumber('cost')} />
          <NumberField label="Unlock (Citizens)" value={building.unlockCitizens} onCommit={withNumber('unlockCitizens')} />
          <NumberField label="Initial slots" value={building.initialSlots} placeholder="0" onCommit={(value) => change({ initialSlots: value || undefined })} />
          <CheckboxField label="Requires road" checked={building.requiresRoad ?? true} onChange={(requiresRoad) => change({ requiresRoad })} />
        </>
      )}
      {building.sport && (
        <>
          <NumberField label="Radius (tiles)" value={building.sport.radius} onCommit={(radius) => change({ sport: { ...building.sport!, radius: radius ?? 1 } })} />
          <NumberField label="Well-being bonus" value={building.sport.wellbeingBonus} onCommit={(bonus) => change({ sport: { ...building.sport!, wellbeingBonus: bonus ?? 0 } })} />
        </>
      )}
      <button onClick={() => onChange(undefined)}>remove building</button>
    </fieldset>
  )
}
