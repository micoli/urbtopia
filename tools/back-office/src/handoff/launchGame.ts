import { READY_MESSAGE, SAVE_MESSAGE } from '../../../../src/backOffice/handoff'

export interface SaveToLaunch {
  handle: string | null
  revision: number
  envelope: unknown
}

export function gameLaunchUrl(gameUrl: string): string {
  const url = new URL(gameUrl)
  url.search = '?bypass-tutorial&from-back-office'
  return url.href
}

export function saveMessage({ handle, revision, envelope }: SaveToLaunch) {
  return { type: SAVE_MESSAGE, handle, revision, envelope: JSON.stringify(envelope) }
}

export function isReadyMessage(event: Pick<MessageEvent, 'origin' | 'data'>, gameOrigin: string): boolean {
  return event.origin === gameOrigin && (event.data as { type?: unknown } | null)?.type === READY_MESSAGE
}

export function launchGame(gameUrl: string, save: SaveToLaunch): boolean {
  const game = window.open(gameLaunchUrl(gameUrl), '_blank')
  if (!game) return false
  const origin = new URL(gameUrl).origin
  const onMessage = (event: MessageEvent) => {
    if (event.source !== game || !isReadyMessage(event, origin)) return
    window.removeEventListener('message', onMessage)
    game.postMessage(saveMessage(save), origin)
  }
  window.addEventListener('message', onMessage)
  return true
}
