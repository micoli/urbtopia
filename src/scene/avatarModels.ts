import * as THREE from 'three';
import { BICYCLE_MODEL, VENUE_CUSTOMER_MODELS } from '../core/infrastructure/infrastructure';
import { fitMatrixOf } from './modelFit';
import type { ModelLibrary } from './modelLibrary';

// The avatars of the players, as walking figures: one model per avatar, all of them in the library or none drawn.
export const AVATAR_MODELS: readonly string[] = VENUE_CUSTOMER_MODELS;

// The models a figure of the map needs: the avatars, and the bicycle of the cyclists.
export const AVATAR_ASSETS: readonly string[] = [...AVATAR_MODELS, BICYCLE_MODEL];

export const avatarsReady = (library: ModelLibrary | undefined): boolean => library !== undefined && AVATAR_ASSETS.every((model) => library.has(model));

// Every avatar on the map, pedestrian or tourist, is this tall: as tall as a stick figure.
export const AVATAR_HEIGHT = 0.3;

// The size that makes an avatar `height` tall, drawn once the models are in.
export function avatarScale(library: ModelLibrary, height: number): number {
  const first = AVATAR_MODELS[0]!;
  const tall = new THREE.Box3().setFromObject(library.get(first)).applyMatrix4(fitMatrixOf(first)).max.y;
  return tall > 0 ? height / tall : 1;
}
