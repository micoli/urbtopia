import type { Problem } from '../../../../../scripts/definitionProblems'
import type { FieldSpec } from '../../schema/fields'
import type { FieldPath, ModelSlot } from '../form/FieldControl'
import { button } from '../styles'
import { TierCell } from './TierCell'

type Tier = Record<string, unknown>

interface Props {
  fields: FieldSpec[]
  own: Tier[]
  effective: Tier[]
  path: FieldPath
  problems: Problem[]
  selected: number | undefined
  // Fills the height it is given, scrolling inside it with the Tier titles kept on top.
  fill?: boolean
  // What a Tier inherits from: the previous Tier, or the base Tier for a variant.
  inheritsFirst: boolean
  modelSlot: (path: FieldPath) => ModelSlot
  // Read-only: what each Tier makes available, set on the unlocked objects themselves.
  unlocks?: string[][]
  newTier: (tiers: Tier[]) => Tier
  onSelect: (tier: number) => void
  onChange: (tiers: Tier[]) => void
}

const NOT_INHERITED = new Set(['upgradeCost'])

const problemsAt = (problems: Problem[], prefix: string) =>
  problems.filter(({ path }) => path === prefix || path.startsWith(`${prefix}.`)).map(problem => ({ ...problem, path: problem.path.slice(prefix.length + 1) }))

// Rows are fields and columns are Tiers, so a progression reads at a glance.
export function TiersMatrix({ fill, fields, own, effective, path, problems, selected, inheritsFirst, modelSlot, unlocks, newTier, onSelect, onChange }: Props) {
  const setCell = (index: number, key: string, value: unknown) =>
    onChange(own.map((tier, position) => (position !== index ? tier : Object.fromEntries(Object.entries({ ...tier, [key]: value }).filter(([, part]) => part !== undefined)))))

  return (
    <div className={`rounded-lg ring-1 ring-zinc-200 ${fill ? 'min-h-0 flex-1 overflow-auto' : 'overflow-x-auto'}`}>
      <table className="border-collapse text-sm">
        <thead>
          <tr className="bg-zinc-50">
            <th className={`sticky left-0 bg-zinc-50 px-3 py-2 ${fill ? 'top-0 z-30' : 'z-10'} text-left text-xs font-medium text-zinc-500`}>Field</th>
            {own.map((_, index) => (
              <th key={index} className={`min-w-52 px-2 py-1.5 text-left ${fill ? 'sticky top-0 z-20 bg-zinc-50' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <button className={`rounded px-2 py-1 text-xs font-semibold ${selected === index ? 'bg-indigo-600 text-white' : 'text-zinc-700 hover:bg-zinc-200'}`} onClick={() => onSelect(index)} title="Show this Tier in the preview">
                    Tier {index + 1}
                  </button>
                  {index === own.length - 1 && own.length > 1 && (
                    <button className="rounded px-1.5 text-xs text-zinc-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove Tier ${index + 1}`} onClick={() => onChange(own.slice(0, -1))}>×</button>
                  )}
                </div>
              </th>
            ))}
            <th className={`px-2 ${fill ? 'sticky top-0 z-20 bg-zinc-50' : ''}`}>
              <button className={button('ghost')} onClick={() => onChange([...own, newTier(own)])}>＋ Tier</button>
            </th>
          </tr>
        </thead>
        <tbody>
          {fields.map(field => (
            <tr key={field.key} className="border-t border-zinc-100 align-top">
              <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-medium whitespace-nowrap text-zinc-600">{field.label}</th>
              {own.map((tier, index) => (
                <td key={index} className={`px-1 py-1 ${selected === index ? 'bg-indigo-50/40' : ''}`}>
                  <TierCell
                    field={field}
                    own={tier[field.key]}
                    effective={effective[index]?.[field.key]}
                    inherits={(index > 0 || inheritsFirst) && !NOT_INHERITED.has(field.key)}
                    settable={index > 0 || inheritsFirst || !NOT_INHERITED.has(field.key)}
                    path={[...path, index, field.key]}
                    problems={problemsAt(problems, `${index}.${field.key}`)}
                    modelSlot={modelSlot}
                    onChange={value => setCell(index, field.key, value)}
                  />
                </td>
              ))}
              <td />
            </tr>
          ))}
          {unlocks && (
            <tr className="border-t border-zinc-100 align-top">
              <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-medium whitespace-nowrap text-zinc-600" title="Set by the minimum Tier of each Material or Good">Unlocks</th>
              {own.map((_, index) => (
                <td key={index} className="px-2 py-2 text-xs text-zinc-500">{unlocks[index]?.length ? unlocks[index]!.join(', ') : '—'}</td>
              ))}
              <td />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
