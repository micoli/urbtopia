import { READY_MESSAGE, REPORT_MESSAGE, SAVE_MESSAGE } from '../../../../src/backOffice/handoff'

export interface SaveToLaunch {
  handle: string | null
  revision: number
  envelope: unknown
}

export interface ReportToLaunch {
  reportId: number
  envelope: string
  camera: unknown
}

export type LaunchPayload = { kind: 'save'; save: SaveToLaunch } | { kind: 'report'; report: ReportToLaunch }

export function gameLaunchUrl(gameUrl: string): string {
  const url = new URL(gameUrl)
  url.search = '?bypass-tutorial&from-back-office'
  return url.href
}

export function saveMessage({ handle, revision, envelope }: SaveToLaunch) {
  return { type: SAVE_MESSAGE, handle, revision, envelope: JSON.stringify(envelope) }
}

export function reportMessage({ reportId, envelope, camera }: ReportToLaunch) {
  return { type: REPORT_MESSAGE, reportId, envelope, camera }
}

export function launchMessage(payload: LaunchPayload) {
  return payload.kind === 'save' ? saveMessage(payload.save) : reportMessage(payload.report)
}

export function isReadyMessage(event: Pick<MessageEvent, 'origin' | 'data'>, gameOrigin: string): boolean {
  return event.origin === gameOrigin && (event.data as { type?: unknown } | null)?.type === READY_MESSAGE
}
