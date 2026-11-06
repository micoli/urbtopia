import { useRouteProfile } from '../hooks/useRouteProfile'
import { ConnectionScreen } from './ConnectionScreen'
import { Shell } from './Shell'

export function App() {
  const profile = useRouteProfile()
  return profile ? <Shell key={profile.id} profile={profile} /> : <ConnectionScreen />
}
