import type { Aim } from '../../../src/core/dailyPuzzle/types'

export const MODEL_KEYS = [
  'puzzle/ball', 'puzzle/trampoline', 'puzzle/spring', 'puzzle/seesaw', 'puzzle/fan', 'puzzle/conveyor', 'puzzle/ramp',
  'puzzle/target', 'puzzle/candle', 'puzzle/switch', 'puzzle/star',
]

export interface PartLook {
  model: string
  mirrored: boolean
}

// A Part kind is `<family>-<side>`: the models are the right-hand ones, the left-hand Parts are the same model mirrored.
export function partLook(kind: string): PartLook {
  const split = kind.lastIndexOf('-')
  return { model: `puzzle/${kind.slice(0, split)}`, mirrored: kind.slice(split + 1) === 'left' }
}

export const aimModels: Record<Aim['kind'], string> = {
  deliver: 'puzzle/target',
  light: 'puzzle/candle',
  flip: 'puzzle/switch',
  collect: 'puzzle/star',
}
