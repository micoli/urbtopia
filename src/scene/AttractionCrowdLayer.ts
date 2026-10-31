import * as THREE from 'three';
import { cityAttractiveness, footprintOf, isCrowdMoving, sellsTickets, touristsPerDay, type Building, type GameState } from '../core';
import { CROWD, crowdPresence, crowdSlots, gatheringFigures, visitorFigures, type CrowdSlot } from './attractionCrowd';
import { stickSpectator } from './stickFigures';

const FIGURE_COLORS = [0xe5484d, 0x4da3ff, 0xffd23f, 0x4be3a2, 0xbba4ff, 0xffa940, 0xf4f6fb].map(color => new THREE.Color(color));
const BEAM_COLORS = [0xbba4ff, 0x75c6ff, 0xffd887].map(color => new THREE.Color(color));
const BEAMS_PER_SITE = 3;
const MAX_BEAM_SITES = 8;
const BEAM_HEIGHT = 9;
const GROUND_HEIGHT = 0.03;
const SLOTS_PER_SITE = CROWD.maxVisitors + CROWD.figuresPerGathering;

// A beam fades out as it rises: with additive blending, black adds nothing.
function beamGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(0.45, 0.05, BEAM_HEIGHT, 12, 4, true).translate(0, BEAM_HEIGHT / 2, 0);
  const heights = geometry.attributes.position!;
  const colors = new Float32Array(heights.count * 3);
  for (let index = 0; index < heights.count; index++) colors.fill(1 - heights.getY(index) / BEAM_HEIGHT, index * 3, index * 3 + 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

interface Site {
  id: number;
  centerX: number;
  centerZ: number;
  halfSize: number;
  slots: CrowdSlot[];
  arrival: Float32Array;
  active: number;
  live: boolean;
}

// Lively Attractions on the map: a few visitors around each one, and during a Gathering its crowd and searchlights. Purely visual.
export class AttractionCrowdLayer {
  readonly root = new THREE.Group();
  private material = new THREE.MeshBasicMaterial({ vertexColors: true });
  private touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  private calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private capacity = this.touch ? CROWD.maxFiguresTouch : CROWD.maxFigures;
  private figures = new THREE.InstancedMesh(stickSpectator(), this.material, this.capacity);
  private beamMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  private beams = new THREE.InstancedMesh(beamGeometry(), this.beamMaterial, BEAMS_PER_SITE * MAX_BEAM_SITES);
  private sites: Site[] = [];
  private layoutKey = '';
  private enabled = true;
  private time = 0;
  private placement = new THREE.Object3D();

  constructor() {
    this.figures.frustumCulled = false;
    this.figures.count = 0;
    this.beams.frustumCulled = false;
    this.beams.count = 0;
    // Colours exist from the start: the material is compiled once, with them.
    this.figures.setColorAt(0, FIGURE_COLORS[0]!);
    this.beams.setColorAt(0, BEAM_COLORS[0]!);
    this.root.add(this.figures, this.beams);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.root.visible = enabled;
  }

  sync(state: GameState): void {
    const attractions = state.buildings.filter(sellsTickets);
    const layoutKey = `${state.buildings.length}|${attractions.map(({ id, x, y, rotation, tier }) => `${id},${x},${y},${rotation},${tier}`).join(';')}`;
    if (layoutKey !== this.layoutKey) {
      this.layoutKey = layoutKey;
      this.rebuildSites(state, attractions);
    }
    const attractiveness = cityAttractiveness(state);
    const byId = new Map(attractions.map(building => [building.id, building]));
    let budget = this.capacity;
    const crowdedFirst = [...this.sites].sort((a, b) => Number(byId.get(b.id)?.attraction?.gathering !== undefined) - Number(byId.get(a.id)?.attraction?.gathering !== undefined));
    for (const site of crowdedFirst) {
      const building = byId.get(site.id);
      if (!building) continue;
      const visitors = visitorFigures(touristsPerDay(building, attractiveness));
      const gathering = building.attraction?.gathering;
      const moving = gathering && isCrowdMoving(gathering, state.lastSeen);
      const crowd = moving ? Math.ceil(gatheringFigures(gathering.crowd) * crowdPresence(gathering, state.lastSeen)) : 0;
      site.active = Math.min(budget, visitors + crowd);
      budget -= site.active;
      site.live = Boolean(gathering && gathering.startsAt <= state.lastSeen && state.lastSeen < gathering.endsAt);
    }
  }

  update(deltaSeconds: number): void {
    if (!this.enabled) return;
    this.time += deltaSeconds;
    let drawn = 0;
    for (const site of this.sites) drawn = this.drawSite(site, deltaSeconds, drawn);
    this.figures.count = drawn;
    this.figures.instanceMatrix.needsUpdate = true;
    if (this.figures.instanceColor) this.figures.instanceColor.needsUpdate = true;
    this.drawBeams();
  }

  dispose(): void {
    this.figures.dispose();
    this.figures.geometry.dispose();
    this.material.dispose();
    this.beams.dispose();
    this.beams.geometry.dispose();
    this.beamMaterial.dispose();
  }

  private rebuildSites(state: GameState, attractions: readonly Building[]): void {
    const blocked = new Set<string>();
    for (const building of state.buildings) {
      const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
      for (let x = building.x; x < building.x + width; x++) for (let z = building.y; z < building.y + depth; z++) blocked.add(`${x},${z}`);
    }
    const known = new Map(this.sites.map(site => [site.id, site]));
    this.sites = attractions.map(building => {
      const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
      const before = known.get(building.id);
      return {
        id: building.id,
        centerX: building.x + width / 2,
        centerZ: building.y + depth / 2,
        halfSize: Math.max(width, depth) / 2,
        slots: crowdSlots(building, blocked, SLOTS_PER_SITE, FIGURE_COLORS.length),
        arrival: before?.arrival ?? new Float32Array(SLOTS_PER_SITE),
        active: before?.active ?? 0,
        live: before?.live ?? false,
      };
    });
  }

  private drawSite(site: Site, deltaSeconds: number, firstIndex: number): number {
    const step = deltaSeconds / CROWD.walkIn;
    let index = firstIndex;
    site.slots.forEach((slot, slotIndex) => {
      const arrival = site.arrival[slotIndex] ?? 0;
      const wanted = slotIndex < site.active ? 1 : 0;
      const next = wanted > arrival ? Math.min(wanted, arrival + step) : Math.max(wanted, arrival - step);
      site.arrival[slotIndex] = next;
      if (next <= 0 || index >= this.capacity) return;
      const drift = this.calm ? 0 : 0.12;
      const x = slot.x + (slot.fromX - slot.x) * (1 - next) + Math.sin(this.time * 0.35 + slot.phase) * drift;
      const z = slot.z + (slot.fromZ - slot.z) * (1 - next) + Math.cos(this.time * 0.27 + slot.phase) * drift;
      const jump = site.live && !this.calm && next === 1 ? Math.abs(Math.sin(this.time * 4 + slot.phase)) * 0.05 : 0;
      this.placement.position.set(x, GROUND_HEIGHT + jump, z);
      this.placement.rotation.set(0, next < 1 ? Math.atan2(slot.x - slot.fromX, slot.z - slot.fromZ) : slot.yaw, 0);
      this.placement.scale.setScalar(Math.min(1, next * 8));
      this.placement.updateMatrix();
      this.figures.setMatrixAt(index, this.placement.matrix);
      this.figures.setColorAt(index, FIGURE_COLORS[slot.color]!);
      index++;
    });
    return index;
  }

  private drawBeams(): void {
    let index = 0;
    for (const site of this.sites) {
      if (!site.live || index + BEAMS_PER_SITE > this.beams.instanceMatrix.count) continue;
      for (let beam = 0; beam < BEAMS_PER_SITE; beam++) {
        const angle = (beam / BEAMS_PER_SITE) * Math.PI * 2;
        const sway = this.calm ? 0 : Math.sin(this.time * 0.8 + beam * 2.1) * 0.35;
        this.placement.position.set(site.centerX + Math.cos(angle) * site.halfSize, GROUND_HEIGHT, site.centerZ + Math.sin(angle) * site.halfSize);
        this.placement.rotation.set(Math.sin(angle) * 0.3 + sway, 0, -Math.cos(angle) * 0.3 + sway * 0.6);
        this.placement.scale.setScalar(1);
        this.placement.updateMatrix();
        this.beams.setMatrixAt(index, this.placement.matrix);
        this.beams.setColorAt(index, BEAM_COLORS[beam]!);
        index++;
      }
    }
    this.beams.count = index;
    this.beams.instanceMatrix.needsUpdate = true;
    if (this.beams.instanceColor) this.beams.instanceColor.needsUpdate = true;
  }
}
