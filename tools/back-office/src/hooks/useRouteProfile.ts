import { useEffect } from 'react'
import { activeProfile } from '../domain/profiles'
import { environmentOf, profileForEnvironment } from '../domain/route'
import { useProfiles } from '../store/connectionStore'
import { useRoute } from '../store/routeStore'

export function useRouteProfile() {
  const state = useProfiles()
  const { route, navigate } = useRoute()
  const profile = activeProfile(state)
  const { select } = state

  useEffect(() => {
    if (!profile) return
    const environment = environmentOf(profile)
    if (route.environment === environment) return
    const target = route.environment ? profileForEnvironment(state.profiles, route.environment, state.activeId) : undefined
    if (target) return select(target.id)
    navigate({ environment, view: route.view, id: null }, 'replace')
  }, [profile, route, state.profiles, state.activeId, select, navigate])

  return profile
}
