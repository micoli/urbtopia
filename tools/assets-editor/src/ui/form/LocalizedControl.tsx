import type { LocalizedText } from '../../../../../src/core/buildings/buildingDefinition'
import { CommitInput } from './CommitInput'

interface Props {
  value: LocalizedText | undefined
  label: string
  onChange: (value: LocalizedText) => void
}

const LANGUAGES = ['en', 'fr'] as const

export function LocalizedControl({ value, label, onChange }: Props) {
  const text = value ?? { en: '', fr: '' }
  return (
    <div className="grid gap-1.5">
      {LANGUAGES.map(language => (
        <label key={language} className="flex items-center gap-2">
          <span className="w-6 text-[11px] font-semibold text-zinc-400 uppercase">{language}</span>
          <CommitInput aria-label={`${label} (${language})`} value={text[language]} onCommit={next => onChange({ ...text, [language]: next })} />
        </label>
      ))}
    </div>
  )
}
