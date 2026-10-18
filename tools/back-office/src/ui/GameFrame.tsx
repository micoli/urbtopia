import { useEffect, useRef } from 'react'
import { gameLaunchUrl, isReadyMessage, saveMessage, type SaveToLaunch } from '../handoff/launchGame'
import { panel } from './styles'

export interface GameLaunch {
  id: number
  save: SaveToLaunch
}

interface Props {
  gameUrl: string
  launch: GameLaunch | null
}

export function GameFrame({ gameUrl, launch }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!launch) return
    const origin = new URL(gameUrl).origin
    const onMessage = (event: MessageEvent) => {
      const game = frameRef.current?.contentWindow
      if (!game || event.source !== game || !isReadyMessage(event, origin)) return
      window.removeEventListener('message', onMessage)
      game.postMessage(saveMessage(launch.save), origin)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [launch, gameUrl])

  if (!launch) {
    return (
      <div className={`${panel} flex items-center justify-center p-4 text-sm text-zinc-500`}>
        Pick “Open in game” on a Cloud save to play it here.
      </div>
    )
  }
  return <iframe key={launch.id} ref={frameRef} title="Game" src={gameLaunchUrl(gameUrl)} className={`${panel} h-full w-full`} />
}
