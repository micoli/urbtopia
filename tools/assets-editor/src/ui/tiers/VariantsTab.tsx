import { useState } from 'react'
import { resolveTiers, resolveVariant } from '../../../../../src/core/buildings/tiers'
import type { Problem } from '../../../../../scripts/definitionProblems'
import type { FieldSpec } from '../../schema/fields'
import { useDocument } from '../../store/documentStore'
import type { FieldPath, ModelSlot } from '../form/FieldControl'
import { button, input } from '../styles'
import { TiersMatrix } from './TiersMatrix'

type Tier = Record<string, unknown>
type Variants = Record<string, { tiers: Tier[] }>

interface Props {
  variants: Variants
  baseTiers: Tier[]
  fields: FieldSpec[]
  problems: Problem[]
  modelSlot: (path: FieldPath) => ModelSlot
  onChange: (variants: Variants | undefined) => void
}

const VARIANT_NAME = /^[a-z][A-Za-z0-9]*$/

// Each variant overrides the look of the first Tiers; the activation (solar panels…) stays a rule in code.
export function VariantsTab({ variants, baseTiers, fields, problems, modelSlot, onChange }: Props) {
  const preview = useDocument(state => state.preview)
  const showTier = useDocument(state => state.showTier)
  const [name, setName] = useState('')
  const base = resolveTiers<Tier>(baseTiers)
  const valid = VARIANT_NAME.test(name) && !(name in variants)

  const setVariant = (variant: string, tiers: Tier[] | undefined) => {
    const next = Object.fromEntries(Object.entries({ ...variants, [variant]: tiers ? { tiers } : undefined }).filter(([, value]) => value !== undefined)) as Variants
    onChange(Object.keys(next).length ? next : undefined)
  }

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(variants).map(([variant, { tiers }]) => {
        const prefix = `variants.${variant}.tiers.`
        return (
          <section key={variant} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-semibold">{variant}</h3>
              <span className="text-xs text-zinc-500">overrides Tiers 1 to {tiers.length}</span>
              <button className={`${button('ghost')} ml-auto`} onClick={() => setVariant(variant, undefined)}>Remove variant</button>
            </div>
            <TiersMatrix
              fields={fields}
              own={tiers}
              effective={resolveVariant(base, tiers).slice(0, tiers.length)}
              path={['variants', variant, 'tiers']}
              problems={problems.filter(({ path }) => path.startsWith(prefix)).map(problem => ({ ...problem, path: problem.path.slice(prefix.length) }))}
              selected={preview.variant === variant ? preview.tier : undefined}
              inheritsFirst
              modelSlot={modelSlot}
              newTier={() => ({})}
              onSelect={tier => showTier(tier, variant)}
              onChange={next => setVariant(variant, next)}
            />
          </section>
        )
      })}
      <div className="flex items-center gap-2">
        <input className={`${input} max-w-60`} placeholder="New variant name (camelCase)" value={name} onChange={event => setName(event.target.value.trim())} />
        <button
          className={button()}
          disabled={!valid}
          onClick={() => {
            setVariant(name, [{}])
            setName('')
          }}
        >
          ＋ Variant
        </button>
      </div>
    </div>
  )
}
