import { create } from 'zustand'
import { buildPath, parseRoute, type ResolvedRoute, type Route } from '../domain/route'

interface RouteStore {
  route: Route
  navigate: (route: ResolvedRoute, mode?: 'push' | 'replace') => void
}

export const useRoute = create<RouteStore>()(set => {
  window.addEventListener('popstate', () => set({ route: parseRoute(window.location.pathname) }))
  return {
    route: parseRoute(window.location.pathname),
    navigate: (route, mode = 'push') => {
      const path = buildPath(route)
      if (path !== window.location.pathname) window.history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', path)
      set({ route })
    },
  }
})
