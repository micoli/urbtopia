import { brokenLinkCount, networkTiles, type Building, type GameState, type transportStats } from '../../../../core';
import type { MessageKey } from '../../../../i18n/messages.ts';
import { loadLevel, type LoadLevel } from '../transportMap/transportMapModel.ts';
import { STOP_TYPE } from '../transit/lineModels.ts';

export type RailMetroMode = 'rail' | 'metro';
export const RAIL_METRO_MODES: readonly RailMetroMode[] = ['rail', 'metro'];

type Line = ReturnType<typeof transportStats>['lines'][number];

export interface StationUsage {
  building: Building;
  lineIds: number[];
  boarded: number;
  alighted: number;
}

export interface LineUsage {
  line: Line;
  load: number;
  level: LoadLevel;
}

export interface ModeUsage {
  mode: RailMetroMode;
  stations: StationUsage[];
  lines: LineUsage[];
  trackTiles: number;
  brokenLinks: number;
  riders: number;
  capacity: number;
  vehicles: number;
  costPerHour: number;
  coalPerHour: number;
  advice: MessageKey[];
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export function modeUsage(state: GameState, transport: ReturnType<typeof transportStats>, mode: RailMetroMode): ModeUsage {
  const lines = transport.lines.filter(line => line.mode === mode).map(line => {
    const load = line.capacity > 0 ? line.riders / line.capacity : 0;
    return { line, load, level: loadLevel(load) };
  });
  const servedByMode = new Set(lines.flatMap(({ line }) => line.stops));
  const stations = state.buildings
    .filter(b => b.type === STOP_TYPE[mode] || (b.type === 'transitHub' && servedByMode.has(b.id)))
    .map(building => ({
      building,
      lineIds: lines.filter(({ line }) => line.stops.includes(building.id)).map(({ line }) => line.id),
      boarded: transport.stopFlows.get(building.id)?.boarded ?? 0,
      alighted: transport.stopFlows.get(building.id)?.alighted ?? 0,
    }))
    .sort((a, b) => b.boarded + b.alighted - (a.boarded + a.alighted) || a.building.id - b.building.id);
  const usage = {
    mode,
    stations,
    lines,
    trackTiles: networkTiles(state, mode).length,
    brokenLinks: brokenLinkCount(state, mode),
    riders: sum(lines.map(({ line }) => line.riders)),
    capacity: sum(lines.map(({ line }) => line.capacity)),
    vehicles: sum(lines.map(({ line }) => line.vehicleCount)),
    costPerHour: sum(lines.map(({ line }) => line.costPerHour)),
    coalPerHour: sum(lines.map(({ line }) => line.coalPerHour)),
  };
  return { ...usage, advice: adviceFor(usage) };
}

function adviceFor({ mode, stations, lines, brokenLinks }: Omit<ModeUsage, 'advice'>): MessageKey[] {
  if (!stations.length) return [`railMetro.${mode}.adviceNoStation`];
  const advice: MessageKey[] = [];
  if (brokenLinks) advice.push('railMetro.adviceBroken');
  if (!lines.length) advice.push('railMetro.adviceNoLine');
  if (lines.some(({ line }) => line.status === 'noVehicle')) advice.push('railMetro.adviceNoVehicle');
  if (lines.some(({ line }) => line.status === 'disconnected')) advice.push('railMetro.adviceDisconnected');
  if (lines.some(({ level }) => level === 'saturated')) advice.push('railMetro.adviceSaturated');
  if (lines.length && stations.some(({ lineIds }) => !lineIds.length)) advice.push('railMetro.adviceUnservedStation');
  if (lines.some(({ line }) => line.active) && stations.some(({ lineIds, boarded, alighted }) => lineIds.length && !boarded && !alighted)) advice.push('railMetro.adviceUnusedStation');
  return advice;
}
