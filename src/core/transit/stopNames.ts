export const STOP_NAME_MAX_LENGTH = 40;

const STOP_TYPES: readonly string[] = ['busStop', 'brtStation', 'railStation', 'transitHub'];

export function isTransitStopType(type: string): boolean {
  return STOP_TYPES.includes(type);
}
