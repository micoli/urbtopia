import type { MessageKey } from '../../i18n/messages';
import type { BoatFamily, BuildingType, DropGroup, GameState, Stash } from '../../core';
import { stashOf } from '../../core';
import type { Tool } from '../../tools/tools';
import { BUILDING_SECTIONS, type BuildSection } from '../../codex/buildingSections';
import type { CodexId } from '../../codex/catalog';

export type StashSectionId = 'replan.section.network' | 'replan.section.later' | BuildSection;

export interface StashGroup {
  id: string;
  section: StashSectionId;
  // The section the group belongs to when it is not put off to Later.
  origin?: StashSectionId;
  // The picture of the item: the codex one when it has one, the icon otherwise.
  codexId?: CodexId;
  icon?: string;
  label: MessageKey;
  // Said after the label: a tier, a length.
  detail?: string;
  count: number;
  tool: Tool;
  // What dropping the group takes out of the Stash.
  drop: DropGroup;
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

function crossingsByTier(items: readonly { tier?: number }[]): StashGroup[] {
  return [...countBy(items, (tile) => String(tierOf(tile))).entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([tier, { count }]) => ({ id: tier === '1' ? 'crossings' : `crossings-${tier}`, section: NETWORK, codexId: 'crossing' as CodexId, label: 'replan.group.crossing' as const, ...(tier === '1' ? {} : { detail: tier }), count, tool: { kind: 'replanTile', layer: 'roads', crossing: true, ...(tier === '1' ? {} : { tier: Number(tier) }) } as Tool, drop: { kind: 'tiles', layer: 'roads', crossing: true, ...(tier === '1' ? {} : { tier: Number(tier) }) } as DropGroup }));
}

function tilesByTier(items: readonly { tier?: number }[] | undefined, layer: 'roads' | 'pedestrianWays', label: MessageKey, codexId: CodexId): StashGroup[] {
  return [...countBy(items, (tile) => String(tierOf(tile))).entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([tier, { count }]) => ({ id: `${layer}-${tier}`, section: NETWORK, codexId, label, detail: tier, count, tool: { kind: 'replanPath', layer, ...(tier === '1' ? {} : { tier: Number(tier) }), start: null, horizontalFirst: true }, drop: { kind: 'tiles', layer, ...(tier === '1' ? {} : { tier: Number(tier) }) } }));
}

const sectionOfBuilding = (type: BuildingType): BuildSection => BUILDING_SECTIONS.find((section) => section.types.includes(type))?.title ?? 'build.production';

// The network first, then the Buildings in the order of the build menu, decorations and green spaces last.
const SECTION_ORDER: readonly StashSectionId[] = [NETWORK, ...BUILDING_SECTIONS.map((section) => section.title), 'replan.section.later'];

const positionIn = (group: StashGroup): number => {
  const section = BUILDING_SECTIONS.find((candidate) => candidate.title === group.section);
  return section && group.id.startsWith('building-') ? section.types.indexOf(group.id.slice('building-'.length) as BuildingType) : 0;
};

export function stashSections(state: GameState): { id: StashSectionId; groups: StashGroup[] }[] {
  const later = new Set(state.replan?.later ?? []);
  const groups = stashGroups(state).map((group) => (later.has(group.id) ? { ...group, origin: group.section, section: 'replan.section.later' as const } : group));
  return SECTION_ORDER.map((id) => ({ id, groups: groups.filter((group) => group.section === id).sort((a, b) => positionIn(a) - positionIn(b)) })).filter((section) => section.groups.length > 0);
}

export function stashGroups(state: GameState): StashGroup[] {
  const stash = stashOf(state);
  const roads = stash.roads ?? [];
  const buildings = [...countBy(stash.buildings, (building) => building.type).entries()].map(([type, { count }]): StashGroup => ({
    id: `building-${type}`, section: sectionOfBuilding(type as BuildingType), codexId: type as CodexId, label: `building.${type}` as MessageKey, count, tool: { kind: 'replanBuilding', buildingType: type as BuildingType }, drop: { kind: 'buildings', type: type as BuildingType },
  }));
  const bridges = [...countBy(stash.bridges, (bridge) => `${bridge.carrier ?? 'water'}-${bridge.length}`).entries()].map(([key, { first, count }]): StashGroup => ({
    id: `bridge-${key}`, section: NETWORK, icon: 'bridge.png', label: 'replan.group.bridge', detail: `${first.length}`, count, tool: { kind: 'replanBridge', length: first.length, ...(first.carrier ? { carrier: first.carrier } : {}) }, drop: { kind: 'bridges', length: first.length, ...(first.carrier ? { carrier: first.carrier } : {}) },
  }));
  const boats = [...countBy(stash.boats, (boat) => boat.family).entries()].map(([family, { count }]): StashGroup => ({
    id: `boat-${family}`, section: 'build.water', label: `boat.${family}` as MessageKey, count, tool: { kind: 'replanBoat', family: family as BoatFamily }, drop: { kind: 'boats', family: family as BoatFamily },
  }));
  return [
    ...buildings,
    ...tilesByTier(roads.filter((road) => road.kind !== 'crossing'), 'roads', 'replan.group.road', 'road'),
    ...crossingsByTier(roads.filter((road) => road.kind === 'crossing')),
    ...tilesByTier(stash.pedestrianWays, 'pedestrianWays', 'replan.group.pedestrianWay', 'pedestrianWay'),
    ...single(stash, 'walkways', { id: 'walkways', section: NETWORK, icon: 'infrastructure-networks.png', label: 'replan.group.walkway', tool: { kind: 'replanPath', layer: 'walkways', start: null, horizontalFirst: true }, drop: { kind: 'tiles', layer: 'walkways' } }),
    ...single(stash, 'pedestrianAccesses', { id: 'accesses', section: NETWORK, codexId: 'pedestrianAccess', label: 'replan.group.access', tool: { kind: 'replanTile', layer: 'pedestrianAccesses' }, drop: { kind: 'tiles', layer: 'pedestrianAccesses' } }),
    ...single(stash, 'roundabouts', { id: 'roundabouts', section: NETWORK, codexId: 'roundabout', label: 'replan.group.roundabout', tool: { kind: 'replanTile', layer: 'roundabouts' }, drop: { kind: 'tiles', layer: 'roundabouts' } }),
    ...single(stash, 'brtRoads', { id: 'brt', section: NETWORK, codexId: 'brt', label: 'replan.group.brt', tool: { kind: 'replanPath', layer: 'brtRoads', start: null, horizontalFirst: true }, drop: { kind: 'network', mode: 'brt' } }),
    ...single(stash, 'rails', { id: 'rails', section: NETWORK, codexId: 'rail', label: 'replan.group.rail', tool: { kind: 'replanPath', layer: 'rails', start: null, horizontalFirst: true }, drop: { kind: 'network', mode: 'rail' } }),
    ...single(stash, 'tunnels', { id: 'tunnels', section: NETWORK, icon: 'infrastructure-networks.png', label: 'replan.group.tunnel', tool: { kind: 'replanPath', layer: 'tunnels', start: null, horizontalFirst: true }, drop: { kind: 'network', mode: 'metro' } }),
    ...single(stash, 'waterTiles', { id: 'water', section: NETWORK, icon: 'water.png', label: 'replan.group.water', tool: { kind: 'brush', action: 'replanWater', tiles: [] }, drop: { kind: 'tiles', layer: 'waterTiles' } }),
    ...single(stash, 'fields', { id: 'fields', section: 'build.agriculture', label: 'replan.group.field', tool: { kind: 'brush', action: 'replanField', tiles: [] }, drop: { kind: 'tiles', layer: 'fields' } }),
    ...bridges,
    ...boats,
  ];
}
