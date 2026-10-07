import type { BuildingDefinition, LocalizedText, NatureBuildingDefinition, SportBuildingDefinition } from '../../../../src/core/buildings/buildingDefinition'
import { NATURE_FAMILIES } from '../../../../src/core/environment/natureFamilies'
import { CheckboxField } from './components/CheckboxField'
import { ChoiceSelect } from './components/ChoiceSelect'
import { NumberField } from './components/NumberField'
import { TextField } from './components/TextField'

const blank: LocalizedText = { en: '', fr: '' }

const newSport = (previous?: BuildingDefinition): SportBuildingDefinition => ({
  kind: 'sport', id: previous?.id ?? '', name: previous?.name ?? blank, description: blank, unlockCitizens: 0, cost: 0, radius: 1, wellbeingBonus: 0,
})

const newNature = (previous?: BuildingDefinition): NatureBuildingDefinition => ({ kind: 'nature', id: previous?.id ?? '', family: 'decoration', name: previous?.name ?? blank })

const FAMILIES = Object.keys(NATURE_FAMILIES)

interface Props {
  building: BuildingDefinition | undefined
  onChange: (building: BuildingDefinition | undefined) => void
}

export function BuildingFields({ building, onChange }: Props) {
  const toggle = (checked: boolean) => onChange(checked ? newSport() : undefined)

  if (!building) return (
    <fieldset>
      <legend>Building</legend>
      <CheckboxField label="Placeable building" checked={false} onChange={toggle} />
    </fieldset>
  )

  const withName = (language: keyof LocalizedText) => (value: string) => onChange({ ...building, name: { ...building.name, [language]: value } })

  return (
    <fieldset>
      <legend>Building</legend>
      <CheckboxField label="Placeable building" checked onChange={toggle} />
      <ChoiceSelect label="Kind" value={building.kind} options={['sport', 'nature']} onChange={(kind) => onChange(kind === 'sport' ? newSport(building) : newNature(building))} />
      <TextField label="Id" value={building.id} onCommit={(id) => onChange({ ...building, id })} />
      <TextField label="Name (en)" value={building.name.en} onCommit={withName('en')} />
      <TextField label="Name (fr)" value={building.name.fr} onCommit={withName('fr')} />
      {building.kind === 'nature' ? (
        <ChoiceSelect label="Family" value={building.family} options={FAMILIES} onChange={(family) => onChange({ ...building, family: family as NatureBuildingDefinition['family'] })} />
      ) : (
        <SportFields building={building} onChange={onChange} />
      )}
    </fieldset>
  )
}

function SportFields({ building, onChange }: { building: SportBuildingDefinition; onChange: (building: BuildingDefinition) => void }) {
  const withDescription = (language: keyof LocalizedText) => (value: string) => onChange({ ...building, description: { ...building.description, [language]: value } })
  const withNumber = (field: 'unlockCitizens' | 'cost' | 'radius' | 'wellbeingBonus') => (value: number | undefined) => onChange({ ...building, [field]: value ?? 0 })

  return (
    <>
      <TextField label="Description (en)" value={building.description.en} onCommit={withDescription('en')} />
      <TextField label="Description (fr)" value={building.description.fr} onCommit={withDescription('fr')} />
      <NumberField label="Unlock (Citizens)" value={building.unlockCitizens} onCommit={withNumber('unlockCitizens')} />
      <NumberField label="Cost (Urbs)" value={building.cost} onCommit={withNumber('cost')} />
      <NumberField label="Radius (tiles)" value={building.radius} onCommit={withNumber('radius')} />
      <NumberField label="Well-being bonus" value={building.wellbeingBonus} onCommit={withNumber('wellbeingBonus')} />
    </>
  )
}
