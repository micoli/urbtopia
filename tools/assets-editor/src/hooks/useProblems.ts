import { allBuildingProblems, allModelProblems, type Problem } from '../../../../scripts/definitionProblems'
import { useDocument, type Doc, type Kind } from '../store/documentStore'

export type KindProblem = Problem & { kind: Kind }

export interface Problems {
  all: KindProblem[]
  of: (kind: Kind, id: string) => KindProblem[]
}

function problemsOf(doc: Doc, ships: (file: string) => boolean): Problems {
  const all: KindProblem[] = [
    ...allModelProblems(doc.models).map(problem => ({ ...problem, kind: 'model' as const })),
    ...allBuildingProblems(doc.buildings, { models: doc.models, ships }).map(problem => ({ ...problem, kind: 'building' as const })),
  ]
  const byKey = Map.groupBy(all, ({ kind, id }) => `${kind}:${id}`)
  return { all, of: (kind, id) => byKey.get(`${kind}:${id}`) ?? [] }
}

// Computed once per document, however many rows ask: documents are immutable, so their identity is the cache key.
const cache = new WeakMap<Doc, { ships: (file: string) => boolean; problems: Problems }>()

// The same checks as the build, rerun on every edit: a save is refused while any is left.
export function useProblems(): Problems {
  const doc = useDocument(state => state.doc)
  const ships = useDocument(state => state.assets.ships)
  const cached = cache.get(doc)
  if (cached?.ships === ships) return cached.problems
  const problems = problemsOf(doc, ships)
  cache.set(doc, { ships, problems })
  return problems
}
