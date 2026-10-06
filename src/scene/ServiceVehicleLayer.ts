import * as THREE from 'three';
import type { Coord, GameState } from '../core';
import type { ModelLibrary } from './modelLibrary';
import { buildRoadGraph, emptyRoadGraph, type RoadGraph } from './roadGraph';
import { SERVICE_VEHICLE_MODELS, planServiceTrip, sendsServiceVehicles, tripDelaySeconds } from './serviceTrip';
import { driveServiceTrip, startServiceTrip, type ServiceTrip } from './serviceDrive';
import { TRAFFIC_OPTIONS } from './trafficOptions';
import { poseOf } from './vehicleMotion';
import type { TrafficVehicle } from './vehicleTraffic';

const VEHICLE_SCALE = 0.25;
const ROAD_SURFACE_HEIGHT = 0.02;
const SPEED = 2.5;

interface Trip extends ServiceTrip {
  object: THREE.Object3D;
}

interface Dispatcher {
  id: number;
  remaining: number;
  tripIndex: number;
  trip: Trip | null;
}

export class ServiceVehicleLayer {
  readonly root = new THREE.Group();
  private dispatchers = new Map<number, Dispatcher>();
  private graph: RoadGraph = emptyRoadGraph();
  private roads: GameState['roads'] | null = null;
  private roundabouts: GameState['roundabouts'] | null = null;
  private state: GameState | null = null;
  private enabled = true;
  private ready = false;
  private tiers: ReadonlyMap<string, number> = new Map();
  trafficVehicles: readonly TrafficVehicle[] = [];
  stopTiles: ReadonlySet<string> = new Set();

  constructor(private library: ModelLibrary) {
    this.root.visible = false;
    void this.load();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.root.visible = enabled && this.ready;
  }

  sync(state: GameState): void {
    this.state = state;
    if (state.roads !== this.roads || state.roundabouts !== this.roundabouts) {
      this.roads = state.roads;
      this.roundabouts = state.roundabouts;
      this.graph = buildRoadGraph(state);
      this.tiers = new Map(state.roads.map((road) => [`${road.x},${road.y}`, road.tier ?? 1]));
      for (const dispatcher of this.dispatchers.values()) this.cancel(dispatcher);
    }
    const facilities = new Set(state.buildings.filter((building) => sendsServiceVehicles(building.type)).map((building) => building.id));
    for (const [id, dispatcher] of this.dispatchers) {
      if (facilities.has(id)) continue;
      this.cancel(dispatcher);
      this.dispatchers.delete(id);
    }
    for (const id of facilities) {
      if (!this.dispatchers.has(id)) this.dispatchers.set(id, { id, remaining: tripDelaySeconds(state.seed, id, 0), tripIndex: 0, trip: null });
    }
  }

  update(deltaSeconds: number): void {
    if (!this.enabled || !this.ready || !this.state) return;
    for (const dispatcher of this.dispatchers.values()) {
      if (dispatcher.trip) this.move(dispatcher, deltaSeconds);
      else this.wait(dispatcher, deltaSeconds);
    }
  }

  dispose(): void {
    for (const dispatcher of this.dispatchers.values()) this.cancel(dispatcher);
  }

  private async load(): Promise<void> {
    await this.library.ensure(Object.values(SERVICE_VEHICLE_MODELS));
    this.ready = true;
    this.root.visible = this.enabled;
  }

  private wait(dispatcher: Dispatcher, deltaSeconds: number): void {
    dispatcher.remaining -= deltaSeconds;
    if (dispatcher.remaining > 0 || !this.state) return;
    const facility = this.state.buildings.find((building) => building.id === dispatcher.id);
    const path = facility ? planServiceTrip(this.state, this.graph, facility, dispatcher.tripIndex) : null;
    if (!facility || !path || !sendsServiceVehicles(facility.type)) return this.rest(dispatcher);
    const object = this.library.get(SERVICE_VEHICLE_MODELS[facility.type]).clone(true);
    object.scale.setScalar(VEHICLE_SCALE);
    this.root.add(object);
    dispatcher.trip = { ...startServiceTrip(path, -dispatcher.id, SPEED), object };
    this.place(dispatcher.trip);
  }

  get followingVehicles(): readonly TrafficVehicle[] {
    if (!TRAFFIC_OPTIONS.SERVICE_VEHICLES_FOLLOW_TRAFFIC) return [];
    return [...this.dispatchers.values()].flatMap((dispatcher) => (dispatcher.trip ? [dispatcher.trip.vehicle] : []));
  }

  private move(dispatcher: Dispatcher, deltaSeconds: number): void {
    const trip = dispatcher.trip!;
    const traffic = TRAFFIC_OPTIONS.SERVICE_VEHICLES_FOLLOW_TRAFFIC ? { others: [...this.trafficVehicles, ...this.followingVehicles], stopTiles: this.stopTiles, lanesAt: this.lanesAt } : null;
    if (driveServiceTrip(trip, deltaSeconds, traffic)) {
      this.cancel(dispatcher);
      return this.rest(dispatcher);
    }
    this.place(trip);
  }

  private lanesAt = (tile: Coord): number => this.tiers.get(`${tile.x},${tile.y}`) ?? 1;

  private place(trip: Trip): void {
    const pose = poseOf(trip.vehicle);
    trip.object.position.set(pose.x, ROAD_SURFACE_HEIGHT, pose.z);
    trip.object.rotation.y = pose.yaw;
  }

  private rest(dispatcher: Dispatcher): void {
    dispatcher.tripIndex++;
    dispatcher.remaining = tripDelaySeconds(this.state?.seed ?? '', dispatcher.id, dispatcher.tripIndex);
  }

  private cancel(dispatcher: Dispatcher): void {
    if (!dispatcher.trip) return;
    this.root.remove(dispatcher.trip.object);
    dispatcher.trip = null;
  }
}
