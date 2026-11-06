import { isLevel, type Level } from '../core';
import type { CameraView } from '../scene/cameraUrl';

export interface CameraPose extends CameraView {
  yaw: number;
  level: Level;
}

interface PoseCamera {
  view: CameraView;
  orientation: number;
  setView(view: Partial<CameraView>): void;
  setOrientation(yaw: number): void;
}

export function readCameraPose(camera: Pick<PoseCamera, 'view' | 'orientation'>, level: Level): CameraPose {
  const { x, z, zoom } = camera.view;
  return { x, z, zoom, yaw: camera.orientation, level };
}

export function applyCameraPose(pose: CameraPose, camera: Pick<PoseCamera, 'setView' | 'setOrientation'>, setLevel: (level: Level) => void): void {
  setLevel(pose.level);
  camera.setOrientation(pose.yaw);
  camera.setView({ x: pose.x, z: pose.z, zoom: pose.zoom });
}

export function parseCameraPose(value: unknown): CameraPose | null {
  if (typeof value !== 'object' || value === null) return null;
  const { x, z, zoom, yaw, level } = value as Record<string, unknown>;
  if (![x, z, zoom, yaw].every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
  if (!isLevel(level)) return null;
  return { x: x as number, z: z as number, zoom: zoom as number, yaw: yaw as number, level };
}
