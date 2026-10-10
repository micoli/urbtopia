import { useEffect, useRef, useState } from 'react'
import type { FlatBuilding, LocalizedText } from '../../../../../src/core/buildings/buildingDefinition'
import { descriptionValuesOf, describedValuesOf } from '../../../../../src/core/descriptions/descriptionValues'
import { renderDescription, type DescriptionLanguage } from '../../../../../src/core/descriptions/messageFormat'
import { input } from '../styles'

const LANGUAGES: readonly DescriptionLanguage[] = ['en', 'fr']

interface Props {
  definition: FlatBuilding
  onChange: (description: LocalizedText) => void
}

const rendered = (template: string, language: DescriptionLanguage, definition: FlatBuilding): { text: string } | { error: string } => {
  try {
    return { text: renderDescription(template, language, descriptionValuesOf(definition)) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

// A description is an ICU MessageFormat template: the values it may use are listed with their current value, and each language shows its rendering as it is typed.
export function DescriptionTab({ definition, onChange }: Props) {
  const saved = definition.description ?? { en: '', fr: '' }
  const [drafts, setDrafts] = useState<LocalizedText>(saved)
  const [active, setActive] = useState<DescriptionLanguage>('en')
  const fields = useRef<Partial<Record<DescriptionLanguage, HTMLTextAreaElement | null>>>({})
  useEffect(() => setDrafts(saved), [saved.en, saved.fr])

  const commit = (next: LocalizedText) => {
    if (next.en !== saved.en || next.fr !== saved.fr) onChange(next)
  }

  const insert = (name: string) => {
    const field = fields.current[active]
    const text = drafts[active]
    const start = field?.selectionStart ?? text.length
    const end = field?.selectionEnd ?? text.length
    const next = { ...drafts, [active]: `${text.slice(0, start)}{${name}}${text.slice(end)}` }
    setDrafts(next)
    commit(next)
  }

  const values = describedValuesOf(definition)

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
      <div className="flex flex-col gap-4">
        {LANGUAGES.map(language => {
          const result = rendered(drafts[language], language, definition)
          return (
            <label key={language} className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Description ({language})</span>
              <textarea
                ref={element => {
                  fields.current[language] = element
                }}
                className={`${input} min-h-24`}
                value={drafts[language]}
                onFocus={() => setActive(language)}
                onChange={event => setDrafts({ ...drafts, [language]: event.target.value })}
                onBlur={() => commit(drafts)}
              />
              {'error' in result ? <p className="text-xs text-red-600">{result.error}</p> : <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-700 ring-1 ring-zinc-200">{result.text}</p>}
            </label>
          )
        })}
      </div>
      <aside className="flex flex-col gap-1">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase">Values · insert in {active}</h3>
        {values.length ? (
          <ul className="divide-y divide-zinc-100 rounded-lg ring-1 ring-zinc-200">
            {values.map(({ name, label, value }) => (
              <li key={name}>
                <button type="button" className="flex w-full flex-col px-3 py-1.5 text-left hover:bg-zinc-50" onMouseDown={event => event.preventDefault()} onClick={() => insert(name)} title={label}>
                  <span className="flex items-baseline justify-between gap-2">
                    <code className="text-xs text-indigo-700">{`{${name}}`}</code>
                    <span className="text-sm font-medium text-zinc-800">{value ?? '—'}</span>
                  </span>
                  <span className="truncate text-[11px] text-zinc-500">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">This kind has no value to mention.</p>
        )}
      </aside>
    </div>
  )
}
