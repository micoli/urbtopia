import { useConnection } from '../store/connectionStore'
import { ConnectionScreen } from './ConnectionScreen'
import { Shell } from './Shell'

export function App() {
  const connection = useConnection(state => state.connection)
  return connection ? <Shell connection={connection} /> : <ConnectionScreen />
}
