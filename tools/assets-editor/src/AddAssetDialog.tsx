import { useEffect, useRef, useState } from 'react'
import { base64Of, callAssets } from './api'

const MODES = ['glb (hand-made)', 'poly.pizza', 'zip (kenney)', 'zip (quaternius)'] as const
type Mode = (typeof MODES)[number]

const FIELDS_BY_MODE: Record<Mode, string[]> = {
  'glb (hand-made)': ['file', 'category', 'name', 'license', 'author', 'url', 'note'],
  'poly.pizza': ['input', 'license'],
  'zip (kenney)': ['file', 'name'],
  'zip (quaternius)': ['file', 'name'],
}

const LABELS: Record<string, string> = { category: 'category (folder)', input: 'poly.pizza URL or id', license: 'license (required)', url: 'source url' }

const slugOf = (fileName: string) => fileName.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

interface Props {
  onClose: () => void
}

export function AddAssetDialog({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<Mode>(MODES[0])
  const [values, setValues] = useState<Record<string, string>>({})
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const setValue = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }))

  const pickFile = (picked: File | null) => {
    setFile(picked)
    if (picked && !values.name) setValue('name', slugOf(picked.name))
  }

  const submit = async () => {
    setStatus('working...')
    const value = (name: string) => (values[name] ?? '').trim()
    const dataBase64 = file ? await base64Of(file) : ''
    const error = await callAssets(...request(mode, value, file, dataBase64))
    if (error) return setStatus(error)
    location.reload()
  }

  return (
    <dialog ref={dialogRef} onClose={onClose}>
      <div className="add-form">
        <select value={mode} onChange={(event) => setMode(event.target.value as Mode)}>
          {MODES.map((candidate) => <option key={candidate}>{candidate}</option>)}
        </select>
        {FIELDS_BY_MODE[mode].map((name) => (
          <div className="row" key={name}>
            {LABELS[name] ?? name}:{' '}
            {name === 'file'
              ? <input type="file" onChange={(event) => pickFile(event.target.files?.[0] ?? null)} />
              : <input value={values[name] ?? ''} onChange={(event) => setValue(name, event.target.value)} />}
          </div>
        ))}
        <button onClick={submit}>add</button>
        <button onClick={onClose}>cancel</button>
        <div>{status}</div>
      </div>
    </dialog>
  )
}

function request(mode: Mode, value: (name: string) => string, file: File | null, dataBase64: string): [string, object] {
  if (mode === 'poly.pizza') return ['add-poly', { input: value('input'), license: value('license') }]
  if (mode === 'glb (hand-made)') return ['add-glb', { category: value('category'), name: value('name'), dataBase64, license: value('license'), author: value('author'), url: value('url'), note: value('note') }]
  return ['add-pack', { kind: mode === 'zip (kenney)' ? 'kenney' : 'quaternius', name: value('name'), archive: file?.name ?? '', dataBase64 }]
}
