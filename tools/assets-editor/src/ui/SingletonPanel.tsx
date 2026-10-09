import { singletonSpecOf, type SingletonName } from '../../../../scripts/singletons'
import { useDirty } from '../hooks/useDirty'
import { useProblems } from '../hooks/useProblems'
import { singletonFieldsOf } from '../schema/fields'
import { useDocument } from '../store/documentStore'
import { setIn, setSingleton } from '../store/edits'
import { SchemaForm } from './form/SchemaForm'
import { badge, panel } from './styles'

interface Props {
  name: SingletonName
}

export function SingletonPanel({ name }: Props) {
  const value = useDocument(state => state.doc.singletons[name])
  const change = useDocument(state => state.change)
  const problems = useProblems().of('singletons', name)
  const dirty = useDirty().has('singletons', name)
  const spec = singletonSpecOf(name)

  return (
    <article className={`${panel} flex flex-col`}>
      <header className="flex flex-wrap items-center gap-2 border-b border-zinc-200 p-4">
        <h2 className="text-lg font-semibold">{spec.title}</h2>
        {dirty && <span className={badge('amber')}>modified</span>}
        <p className="w-full font-mono text-xs text-zinc-500">{spec.file}</p>
      </header>
      <div className="p-4">
        <SchemaForm fields={singletonFieldsOf(name)} value={value} problems={problems} onChange={(key, next) => change(doc => setSingleton(doc, name, setIn(value, [key], next) as Record<string, unknown>))} />
      </div>
    </article>
  )
}
