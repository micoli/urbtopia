import { Dialog } from 'radix-ui'
import { useState } from 'react'
import { base64Of, callAssets, fetchCatalog } from '../api'
import { useDocument } from '../store/documentStore'
import { button, dialogContent, dialogOverlay, input } from './styles'

const MODES = { glb: 'Hand-made GLB', poly: 'Poly Pizza', kenney: 'Kenney zip', quaternius: 'Quaternius zip' } as const
type Mode = keyof typeof MODES

const FIELDS: Record<Mode, string[]> = {
  glb: ['category', 'name', 'license', 'author', 'url', 'note'],
  poly: ['input', 'license'],
  kenney: ['name'],
  quaternius: ['name'],
}

const LABELS: Record<string, string> = { category: 'Category (folder)', input: 'Poly Pizza URL or id', license: 'License (required)', url: 'Source URL' }

const slugOf = (fileName: string) => fileName.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const modeOfFile = (file: File): Mode => (file.name.endsWith('.zip') ? 'kenney' : 'glb')

interface Props {
  initialFile?: File
  initialUrl?: string
  onClose: () => void
}

export function ImportDialog({ initialFile, initialUrl, onClose }: Props) {
  const [mode, setMode] = useState<Mode>(initialUrl ? 'poly' : initialFile ? modeOfFile(initialFile) : 'glb')
  const [file, setFile] = useState<File | null>(initialFile ?? null)
  const [values, setValues] = useState<Record<string, string>>({ ...(initialUrl ? { input: initialUrl } : {}), ...(initialFile ? { name: slugOf(initialFile.name) } : {}) })
  const [status, setStatus] = useState('')
  const needsFile = mode !== 'poly'

  const value = (name: string) => (values[name] ?? '').trim()

  const submit = async () => {
    setStatus('Importing…')
    const dataBase64 = file ? await base64Of(file) : ''
    const [operation, body] =
      mode === 'poly'
        ? ['add-poly', { input: value('input'), license: value('license') }]
        : mode === 'glb'
          ? ['add-glb', { category: value('category'), name: value('name'), dataBase64, license: value('license'), author: value('author'), url: value('url'), note: value('note') }]
          : ['add-pack', { kind: mode, name: value('name'), archive: file?.name ?? '', dataBase64 }]
    const error = await callAssets(operation, body)
    if (error) return setStatus(error)
    const { adoptCatalog, setStatus: report } = useDocument.getState()
    adoptCatalog(await fetchCatalog())
    report('Asset imported')
    onClose()
  }

  return (
    <Dialog.Root open onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogOverlay} />
        <Dialog.Content className={dialogContent}>
          <Dialog.Title className="text-base font-semibold">Import an asset</Dialog.Title>
          <Dialog.Description className="text-sm text-zinc-600">The file is added under assets/ and the game models are refreshed. Your pending edits are kept.</Dialog.Description>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1">
            {(Object.keys(MODES) as Mode[]).map(option => (
              <button key={option} onClick={() => setMode(option)} className={`rounded-md px-2 py-1 text-xs font-medium ${mode === option ? 'bg-white shadow-sm' : 'text-zinc-600'}`}>{MODES[option]}</button>
            ))}
          </div>
          {needsFile && (
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              File
              <input
                type="file"
                accept={mode === 'glb' ? '.glb' : '.zip'}
                className="text-sm"
                onChange={event => {
                  const picked = event.target.files?.[0] ?? null
                  setFile(picked)
                  if (picked && !values.name) setValues(current => ({ ...current, name: slugOf(picked.name) }))
                }}
              />
              {file && <span className="text-xs text-zinc-500">{file.name}</span>}
            </label>
          )}
          {FIELDS[mode].map(name => (
            <label key={name} className="flex flex-col gap-1 text-sm text-zinc-600">
              {LABELS[name] ?? name[0]!.toUpperCase() + name.slice(1)}
              <input className={input} value={values[name] ?? ''} onChange={event => setValues(current => ({ ...current, [name]: event.target.value }))} />
            </label>
          ))}
          <p className="min-h-4 text-xs text-zinc-600" role="status">{status}</p>
          <div className="flex justify-end gap-2">
            <button className={button()} onClick={onClose}>Cancel</button>
            <button className={button('primary')} disabled={needsFile && !file} onClick={() => void submit()}>Import</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
