import * as THREE from 'three';
import { buildingFlowsOf, flowEndpointsOf, isPainted, homeTintsOf, layerFieldsOf, type AnalyticsLayerId, type BuildingFlows, type Coord, type FlowEndpoint, type GameState, type HomeTint, type LayerField, type ServiceCategory } from '../core';
import { FLOW_COLORS, MODE_COLORS, rampColor } from './analyticsRamps';

const REFRESH_MS = 15000;
const BEACON_WIDTH = 0.5;
const BEACON_MIN_HEIGHT = 1.5;
const BEACON_EXTRA_HEIGHT = 2.5;
const LAYOUT_REFRESH_MS = 500;
const ROUTE_WIDTH = 0.4;
const ROUTE_HEIGHT = 0.12;
const TRIP_MODES = ['walk', 'cycle', 'car'] as const;

export class AnalyticsLayer {
  readonly root = new THREE.Group();
  private tileGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  private material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthTest: false, depthWrite: false, toneMapped: false });
  private beaconGeometry = new THREE.BoxGeometry(1, 1, 1);
  private beaconMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, toneMapped: false });
  private layout = '';
  private layer: AnalyticsLayerId | null = null;
  private category: ServiceCategory | null = null;
  private buildingId: number | null = null;
  private builtAt = 0;

  constructor() {
    this.root.name = 'analytics-layer';
    this.root.renderOrder = 6;
    this.root.visible = false;
  }

  sync(state: GameState, layer: AnalyticsLayerId | null, category: ServiceCategory, buildingId: number | null = null, now = performance.now()): void {
    if (!layer) {
      this.layer = null;
      this.root.visible = false;
      return;
    }
    const layout = `${state.buildings.length}:${state.roads.length}:${state.pedestrianWays?.length ?? 0}`;
    const elapsed = now - this.builtAt;
    const sameView = this.layer === layer && this.category === category && this.buildingId === buildingId;
    if (sameView && (elapsed < LAYOUT_REFRESH_MS || (layout === this.layout && elapsed < REFRESH_MS))) return;
    this.layer = layer;
    this.category = category;
    this.buildingId = buildingId;
    this.layout = layout;
    this.builtAt = now;
    this.clearMeshes();
    const fields = layerFieldsOf(state, layer, category);
    const tints = homeTintsOf(state, layer, category);
    this.root.visible = fields.length > 0 || tints.length > 0;
    fields.forEach((field, index) => this.addField(field, `analytics-${layer}-${index}`, 6 + index * 0.1));
    this.addHomeTints(tints, `analytics-${layer}-homes`);
    const flows = flowEndpointsOf(state, layer);
    if (flows) {
      this.addBeacons(flows.origins, FLOW_COLORS.origins, `analytics-${layer}-origins`);
      this.addBeacons(flows.destinations, FLOW_COLORS.destinations, `analytics-${layer}-destinations`);
      this.root.visible = true;
    }
    const buildingFlows = layer === 'movement.flows' && buildingId !== null ? buildingFlowsOf(state, buildingId) : null;
    if (buildingFlows) {
      this.addBuildingFlows(buildingFlows, `analytics-${layer}`);
      this.root.visible = true;
    }
  }

  // The selected building in yellow, the buildings its Citizens come from in green and those they go to in pink, and the route of each mode.
  private addBuildingFlows({ building, arrivals, departures, routes }: BuildingFlows, name: string): void {
    this.addBeacons([building], FLOW_COLORS.selected, `${name}-selected`);
    this.addBeacons(arrivals, FLOW_COLORS.origins, `${name}-arrivals`);
    this.addBeacons(departures, FLOW_COLORS.destinations, `${name}-departures`);
    for (const mode of TRIP_MODES) this.addRoute(routes[mode], MODE_COLORS[mode], `${name}-route-${mode}`);
  }

  private addRoute(tiles: readonly Coord[], color: string, name: string): void {
    if (!tiles.length) return;
    const mesh = new THREE.InstancedMesh(this.tileGeometry, this.beaconMaterial, tiles.length);
    mesh.name = name;
    mesh.renderOrder = 7;
    const matrix = new THREE.Matrix4();
    tiles.forEach((tile, instance) => {
      matrix.makeScale(ROUTE_WIDTH, 1, ROUTE_WIDTH).setPosition(tile.x + 0.5, ROUTE_HEIGHT, tile.y + 0.5);
      mesh.setMatrixAt(instance, matrix);
      mesh.setColorAt(instance, new THREE.Color(color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.root.add(mesh);
  }

  // A column over each building, taller for the busier ones.
  private addBeacons(endpoints: readonly FlowEndpoint[], color: string, name: string): void {
    if (!endpoints.length) return;
    const busiest = Math.max(1, ...endpoints.map(endpoint => endpoint.volume));
    const mesh = new THREE.InstancedMesh(this.beaconGeometry, this.beaconMaterial, endpoints.length);
    mesh.name = name;
    mesh.renderOrder = 8;
    const matrix = new THREE.Matrix4();
    endpoints.forEach((endpoint, instance) => {
      const height = BEACON_MIN_HEIGHT + BEACON_EXTRA_HEIGHT * endpoint.volume / busiest;
      matrix.makeScale(BEACON_WIDTH, height, BEACON_WIDTH).setPosition(endpoint.x + endpoint.width / 2, height / 2 + 0.1, endpoint.y + endpoint.depth / 2);
      mesh.setMatrixAt(instance, matrix);
      mesh.setColorAt(instance, new THREE.Color(color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.root.add(mesh);
  }

  private addHomeTints(tints: readonly HomeTint[], name: string): void {
    if (!tints.length) return;
    const mesh = new THREE.InstancedMesh(this.tileGeometry, this.material, tints.length);
    mesh.name = name;
    mesh.renderOrder = 7;
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    tints.forEach((tint, instance) => {
      matrix.makeScale(tint.width - 0.08, 1, tint.depth - 0.08).setPosition(tint.x + tint.width / 2, 0.1, tint.y + tint.depth / 2);
      mesh.setMatrixAt(instance, matrix);
      mesh.setColorAt(instance, color.setHex(rampColor(tint.ramp, tint.share)));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.root.add(mesh);
  }

  private addField({ field, ramp }: LayerField, name: string, renderOrder: number): void {
    const tiles: number[] = [];
    field.values.forEach((value, index) => {
      if (isPainted(field, value)) tiles.push(index);
    });
    if (!tiles.length) return;
    const mesh = new THREE.InstancedMesh(this.tileGeometry, this.material, tiles.length);
    mesh.name = name;
    mesh.renderOrder = renderOrder;
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    tiles.forEach((index, instance) => {
      matrix.makeScale(0.96, 1, 0.96).setPosition((index % field.size) + 0.5, 0.09, Math.floor(index / field.size) + 0.5);
      mesh.setMatrixAt(instance, matrix);
      mesh.setColorAt(instance, color.setHex(rampColor(ramp, field.values[index]! / field.max)));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.root.add(mesh);
  }

  private clearMeshes(): void {
    for (const child of [...this.root.children]) {
      if (!(child instanceof THREE.InstancedMesh)) continue;
      this.root.remove(child);
      child.dispose();
    }
  }

  dispose(): void {
    this.clearMeshes();
    this.tileGeometry.dispose();
    this.material.dispose();
    this.beaconGeometry.dispose();
    this.beaconMaterial.dispose();
    this.root.clear();
  }
}
