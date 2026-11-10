import type { MessageKey } from '../../i18n/messages';
import type { BoatFamily, BuildingType, GameState, Stash } from '../../core';
import { stashOf } from '../../core';
import type { Tool } from '../../tools/tools';
import { BUILDING_SECTIONS, type BuildSection } from '../../codex/buildingSections';
import type { CodexId } from '../../codex/catalog';

export type StashSectionId = 'replan.section.network' | BuildSection;

export interface StashGroup {
  id: string;
  section: StashSectionId;
  // The picture of the item: the codex one when it has one, the icon otherwise.
  codexId?: CodexId;
  icon?: string;
  label: MessageKey;
  // Said after the label: a tier, a length.
  detail?: string;
  count: number;
  tool: Tool;
}

const countBy = <T>(items: readonly T[] | undefined, keyOf: (item: T) => string): Map<string, { first: T; count: number }> => {
  const groups = new Map<string, { first: T; count: number }>();
  for (const item of items ?? []) {
    const key = keyOf(item);
    const known = groups.get(key);
    if (known) known.count += 1;
    else groups.set(key, { first: item, count: 1 });
  }
  return groups;
};

const tierOf = (tile: { tier?: number }): number => tile.tier ?? 1;

function single(stash: Stash, key: 'walkways' | 'pedestrianAccesses' | 'roundabouts' | 'waterTiles' | 'fields' | 'brtRoads' | 'rails' | 'tunnels', group: Omit<StashGroup, 'count'>): StashGroup[] {
  const count = stash[key]?.length ?? 0;
  return count > 0 ? [{ ...group, count }] : [];
}

const NETWORK = 'replan.section.network' as const;

function tilesByTier(items: readonly { tier?: number }[] | undefined, layer: 'roads' | 'pedestrianWays', label: MessageKey, codexId: CodexId): StashGroup[] {
  return [...countBy(items, (tile) => String(tierOf(tile))).entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([tier, { count }]) => ({ id: `${layer}-${tier}`, section: NETWORK, codexId, label, detail: tier, count, tool: { kind: 'replanPath', layer, ...(tier === '1' ? {} : { tier: Number(tier) }), start: null, horizontalFirst: true } }));
}

const sectionOfBuilding = (type: BuildingType): BuildSection => BUILDING_SECTIONS.find((section) => section.types.includes(type))?.title ?? 'build.production';

// The network first, then the Buildings in the order of the build menu, decorations and green spaces last.
const SECTION_ORDER: readonly StashSectionId[] = [NETWORK, ...BUILDING_SECTIONS.map((section) => section.title)];

const positionIn = (group: StashGroup): number => {
  const section = BUILDING_SECTIONS.find((candidate) => candidate.title === group.section);
  return section && group.id.startsWith('building-') ? section.types.indexOf(group.id.slice('building-'.length) as BuildingType) : 0;
};

export function stashSections(state: GameState): { id: StashSectionId; groups: StashGroup[] }[] {
  const groups = stashGroups(state);
  return SECTION_ORDER.map((id) => ({ id, groups: groups.filter((group) => group.section === id).sort((a, b) => positionIn(a) - positionIn(b)) })).filter((section) => section.groups.length > 0);
}

export function stashGroups(state: GameState): StashGroup[] {
  const stash = stashOf(state);
  const roads = stash.roads ?? [];
  const crossings = roads.filter((road) => road.kind === 'crossing').length;
  const buildings = [...countBy(stash.buildings, (building) => building.type).entries()].map(([type, { count }]): StashGroup => ({
    id: `building-${type}`, section: sectionOfBuilding(type as BuildingType), codexId: type as CodexId, label: `building.${type}` as MessageKey, count, tool: { kind: 'replanBuilding', buildingType: type as BuildingType },
  }));
  const bridges = [...countBy(stash.bridges, (bridge) => `${bridge.carrier ?? 'water'}-${bridge.length}`).entries()].map(([key, { first, count }]): StashGroup => ({
    id: `bridge-${key}`, section: NETWORK, icon: 'bridge.png', label: 'replan.group.bridge', detail: `${first.length}`, count, tool: { kind: 'replanBridge', length: first.length, ...(first.carrier ? { carrier: first.carrier } : {}) },
  }));
  const boats = [...countBy(stash.boats, (boat) => boat.family).entries()].map(([family, { count }]): StashGroup => ({
    id: `boat-${family}`, section: 'build.water', label: `boat.${family}` as MessageKey, count, tool: { kind: 'replanBoat', family: family as BoatFamily },
  }));
  return [
    ...buildings,
    ...tilesByTier(roads.filter((road) => road.kind !== 'crossing'), 'roads', 'replan.group.road', 'road'),
    ...(crossings > 0 ? [{ id: 'crossings', section: NETWORK, codexId: 'crossing' as CodexId, label: 'replan.group.crossing' as const, count: crossings, tool: { kind: 'replanTile', layer: 'roads', crossing: true } as Tool }] : []),
    ...tilesByTier(stash.pedestrianWays, 'pedestrianWays', 'replan.group.pedestrianWay', 'pedestrianWay'),
    ...single(stash, 'walkways', { id: 'walkways', section: NETWORK, icon: 'infrastructure-networks.png', label: 'replan.group.walkway', tool: { kind: 'replanPath', layer: 'walkways', start: null, horizontalFirst: true } }),
    ...single(stash, 'pedestrianAccesses', { id: 'accesses', section: NETWORK, codexId: 'pedestrianAccess', label: 'replan.group.access', tool: { kind: 'replanTile', layer: 'pedestrianAccesses' } }),
    ...single(stash, 'roundabouts', { id: 'roundabouts', section: NETWORK, codexId: 'roundabout', label: 'replan.group.roundabout', tool: { kind: 'replanTile', layer: 'roundabouts' } }),
    ...single(stash, 'brtRoads', { id: 'brt', section: NETWORK, codexId: 'brt', label: 'replan.group.brt', tool: { kind: 'replanPath', layer: 'brtRoads', start: null, horizontalFirst: true } }),
    ...single(stash, 'rails', { id: 'rails', section: NETWORK, codexId: 'rail', label: 'replan.group.rail', tool: { kind: 'replanPath', layer: 'rails', start: null, horizontalFirst: true } }),
    ...single(stash, 'tunnels', { id: 'tunnels', section: NETWORK, icon: 'infrastructure-networks.png', label: 'replan.group.tunnel', tool: { kind: 'replanPath', layer: 'tunnels', start: null, horizontalFirst: true } }),
    ...single(stash, 'waterTiles', { id: 'water', section: NETWORK, icon: 'water.png', label: 'replan.group.water', tool: { kind: 'brush', action: 'replanWater', tiles: [] } }),
    ...single(stash, 'fields', { id: 'fields', section: 'build.agriculture', label: 'replan.group.field', tool: { kind: 'brush', action: 'replanField', tiles: [] } }),
    ...bridges,
    ...boats,
  ];
}
