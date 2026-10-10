import { COLLECTION_NAMES, type CollectionName } from '../../../scripts/collections'
import { useDocument, type View } from './store/documentStore'

// Every view is a path, changed with the History API so that moving between views never reloads the page:
//   /buildings  /buildings/home  /buildings/home/tiers  /compare  /library/<model id>  /settings/<name>
const LIBRARY = 'library'
const SETTINGS = 'settings'
const COMPARE = 'compare'

const isCollection = (segment: string | undefined): segment is CollectionName => COLLECTION_NAMES.includes(segment as CollectionName)

const encode = (segments: (string | null)[]) => `/${segments.filter((segment): segment is string => segment !== null).map(encodeURIComponent).join('/')}`

export function pathOf({ kind, selection, comparing, tab }: View): string {
  if (comparing) return `/${COMPARE}`
  if (!selection) return encode([kind === 'models' ? LIBRARY : kind === 'singletons' ? SETTINGS : kind])
  const root = selection.kind === 'models' ? LIBRARY : selection.kind === 'singletons' ? SETTINGS : selection.kind
  return encode([root, selection.id, tab])
}

export function viewOf(pathname: string): View {
  const [root, id, tab] = pathname.split('/').filter(Boolean).map(decodeURIComponent)
  if (root === COMPARE) return { kind: 'buildings', selection: null, comparing: true, tab: null }
  if (root === LIBRARY) return { kind: 'models', selection: id ? { kind: 'models', id } : null, comparing: false, tab: tab ?? null }
  if (root === SETTINGS) return { kind: 'singletons', selection: id ? { kind: 'singletons', id } : null, comparing: false, tab: null }
  const kind: CollectionName = isCollection(root) ? root : 'buildings'
  return { kind, selection: id ? { kind, id } : null, comparing: false, tab: tab ?? null }
}

const currentView = (): View => {
  const { kind, selection, comparing, tab } = useDocument.getState()
  return { kind, selection, comparing, tab }
}

// Follows the store with pushState, and the browser history (back, forward, a typed URL) with the store.
export function startRouter(): () => void {
  const show = () => useDocument.getState().showView(viewOf(location.pathname))
  show()
  history.replaceState(null, '', pathOf(currentView()))
  const stopStore = useDocument.subscribe(() => {
    const path = pathOf(currentView())
    if (path !== location.pathname) history.pushState(null, '', path)
  })
  window.addEventListener('popstate', show)
  return () => {
    stopStore()
    window.removeEventListener('popstate', show)
  }
}
