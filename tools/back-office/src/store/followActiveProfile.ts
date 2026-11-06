import { activeProfile } from '../domain/profiles'
import { environmentOf } from '../domain/route'
import { useProfiles } from './connectionStore'
import { useRoute } from './routeStore'

export function followActiveProfile(): void {
  const profile = activeProfile(useProfiles.getState())
  if (!profile) return
  const { route, navigate } = useRoute.getState()
  navigate({ environment: environmentOf(profile), view: route.view, id: null })
}
