import { describe, expect, it } from 'vitest'
import { READY_MESSAGE, SAVE_MESSAGE } from '../../../../src/backOffice/handoff'
import { gameLaunchUrl, isReadyMessage, saveMessage } from './launchGame'

describe('gameLaunchUrl', () => {
  it('opens the game without tutorial, flagged as a Back office session', () => {
    expect(gameLaunchUrl('http://localhost:5173')).toBe('http://localhost:5173/?bypass-tutorial&from-back-office')
    expect(gameLaunchUrl('http://localhost:5173/urbix/?x=1')).toBe('http://localhost:5173/urbix/?bypass-tutorial&from-back-office')
  })
})

describe('saveMessage', () => {
  it('sends the envelope as JSON text', () => {
    expect(saveMessage({ handle: 'ada', revision: 4, envelope: { format: 'urbtopia-save' } })).toEqual({
      type: SAVE_MESSAGE,
      handle: 'ada',
      revision: 4,
      envelope: '{"format":"urbtopia-save"}',
    })
  })
})

describe('isReadyMessage', () => {
  it('accepts the ready message from the game origin only', () => {
    expect(isReadyMessage({ origin: 'http://localhost:5173', data: { type: READY_MESSAGE } }, 'http://localhost:5173')).toBe(true)
    expect(isReadyMessage({ origin: 'http://evil.example', data: { type: READY_MESSAGE } }, 'http://localhost:5173')).toBe(false)
    expect(isReadyMessage({ origin: 'http://localhost:5173', data: { type: 'other' } }, 'http://localhost:5173')).toBe(false)
    expect(isReadyMessage({ origin: 'http://localhost:5173', data: null }, 'http://localhost:5173')).toBe(false)
  })
})
