import { useState } from 'react'
import type { LocalizedText } from '../../../../../src/core/buildings/buildingDefinition'
import { CommitInput } from './CommitInput'
import { LocalizedDialog } from './LocalizedDialog'

interface Props {
  value: LocalizedText | undefined
  label: string
  onChange: (value: LocalizedText) => void
}

const LANGUAGES = ['en', 'fr'] as const

// One input per language, with a button opening both in a larger editor.
export function LocalizedControl({ value, label, onChange }: Props) {
  const text = value ?? { en: '', fr: '' }
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-start gap-2">
      <div className="grid min-w-0 flex-1 gap-1.5">
        {LANGUAGES.map(language => (
          <label key={language} className="flex items-center gap-2">
            <span className="w-6 text-[11px] font-semibold text-zinc-400 uppercase">{language}</span>
            <CommitInput aria-label={`${label} (${language})`} value={text[language]} onCommit={next => onChange({ ...text, [language]: next })} />
          </label>
        ))}
      </div>
      <button type="button" aria-label={`Edit ${label} in a larger editor`} title="Open in a larger editor" className="rounded-md px-2 py-1.5 text-zinc-500 ring-1 ring-zinc-300 hover:bg-zinc-100 hover:text-zinc-800" onClick={() => setOpen(true)}>
        ⤢
      </button>
      {open && <LocalizedDialog title={label} value={text} onApply={onChange} onClose={() => setOpen(false)} />}
    </div>
  )
}
