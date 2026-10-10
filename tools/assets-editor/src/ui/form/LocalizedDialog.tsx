import { Dialog } from 'radix-ui'
import { useState } from 'react'
import type { LocalizedText } from '../../../../../src/core/buildings/buildingDefinition'
import { button, dialogContent, dialogOverlay, input } from '../styles'

interface Props {
  title: string
  value: LocalizedText
  onApply: (value: LocalizedText) => void
  onClose: () => void
}

const LANGUAGES = ['en', 'fr'] as const

// Both languages as multi-line text; applied at once, so the whole edit is one undo step.
export function LocalizedDialog({ title, value, onApply, onClose }: Props) {
  const [drafts, setDrafts] = useState(value)

  return (
    <Dialog.Root open onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogOverlay} />
        <Dialog.Content className={`${dialogContent} !w-[min(44rem,94vw)]`}>
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="sr-only">Edit the text in both languages</Dialog.Description>
          {LANGUAGES.map(language => (
            <label key={language} className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase">{language}</span>
              <textarea aria-label={`${title} (${language})`} className={`${input} min-h-32 resize-y`} value={drafts[language]} onChange={event => setDrafts({ ...drafts, [language]: event.target.value })} />
            </label>
          ))}
          <div className="flex justify-end gap-2">
            <button className={button()} onClick={onClose}>Cancel</button>
            <button
              className={button('primary')}
              onClick={() => {
                onApply(drafts)
                onClose()
              }}
            >
              Apply
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
