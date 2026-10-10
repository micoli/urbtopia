import { resolveTiers } from '../../../../../src/core/buildings/tiers'
import type { Problem } from '../../../../../scripts/definitionProblems'
import type { FieldSpec } from '../../schema/fields'
import { useDocument } from '../../store/documentStore'
import type { FieldPath, ModelSlot } from '../form/FieldControl'
import { TiersMatrix } from './TiersMatrix'

type Tier = Record<string, unknown>

interface Props {
  tiers: Tier[]
  fields: FieldSpec[]
  problems: Problem[]
  modelSlot: (path: FieldPath) => ModelSlot
  unlocks?: string[][]
  onChange: (tiers: Tier[]) => void
}

// A new Tier keeps everything and asks for the next upgrade cost.
const nextTier = (tiers: Tier[]): Tier => {
  const previous = tiers.at(-1)?.upgradeCost as { urbs?: number } | undefined
  return { upgradeCost: { urbs: previous?.urbs ?? 0, goods: {} } }
}

export function TiersTab({ tiers, fields, problems, modelSlot, unlocks, onChange }: Props) {
  const preview = useDocument(state => state.preview)
  const showTier = useDocument(state => state.showTier)
  const relative = problems.filter(({ path }) => path.startsWith('tiers.')).map(problem => ({ ...problem, path: problem.path.slice('tiers.'.length) }))

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <p className="shrink-0 text-xs text-zinc-500">A Tier inherits every value it leaves out from the previous Tier, except its upgrade cost. Greyed values are inherited.</p>
      <TiersMatrix
        fill
        fields={fields}
        own={tiers}
        effective={resolveTiers<Tier>(tiers)}
        path={['tiers']}
        problems={relative}
        selected={preview.variant ? undefined : preview.tier}
        inheritsFirst={false}
        modelSlot={modelSlot}
        unlocks={unlocks}
        newTier={nextTier}
        onSelect={tier => showTier(tier)}
        onChange={onChange}
      />
    </div>
  )
}
