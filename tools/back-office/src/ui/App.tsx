import { activeProfile } from '../domain/profiles'
import { useProfiles } from '../store/connectionStore'
import { ConnectionScreen } from './ConnectionScreen'
import { Shell } from './Shell'

export function App() {
  const profile = useProfiles(state => activeProfile(state))
  return profile ? <Shell key={profile.id} profile={profile} /> : <ConnectionScreen />
}
