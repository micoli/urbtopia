import { isLocalUrl, type Profile } from './profiles'

export type Environment = 'production' | 'local'
export type RouteView = 'account' | 'bug-report'

export interface Route {
  environment: Environment | null
  view: RouteView
  id: string | null
}

export type ResolvedRoute = Route & { environment: Environment }

const ENVIRONMENTS: readonly string[] = ['production', 'local']
const VIEWS: readonly string[] = ['account', 'bug-report']

export function environmentOf(profile: Profile): Environment {
  return isLocalUrl(profile.url) ? 'local' : 'production'
}

export function parseRoute(pathname: string): Route {
  const [environment, view, id] = pathname.split('/').filter(segment => segment !== '')
  return {
    environment: ENVIRONMENTS.includes(environment) ? (environment as Environment) : null,
    view: VIEWS.includes(view) ? (view as RouteView) : 'account',
    id: id ? decodeURIComponent(id) : null,
  }
}

export function buildPath({ environment, view, id }: ResolvedRoute): string {
  return `/${environment}/${view}${id === null ? '' : `/${encodeURIComponent(id)}`}`
}

export function profileForEnvironment(profiles: Profile[], environment: Environment, activeId: string | null): Profile | undefined {
  const matching = profiles.filter(profile => environmentOf(profile) === environment)
  return matching.find(profile => profile.id === activeId) ?? matching[0]
}
