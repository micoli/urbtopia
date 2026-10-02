import { useGame } from './game'

export function Toast() {
  const { toast } = useGame()
  return toast ? <div className="toast">{toast}</div> : null
}
