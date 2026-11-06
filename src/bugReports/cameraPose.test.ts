import { describe, expect, it, vi } from 'vitest';
import { applyCameraPose, parseCameraPose, readCameraPose } from './cameraPose';

describe('camera pose', () => {
  it('reads the view, the orientation and the Level', () => {
    expect(readCameraPose({ view: { x: 10, z: 20, zoom: 30 }, orientation: 1.5 }, -1)).toEqual({ x: 10, z: 20, zoom: 30, yaw: 1.5, level: -1 });
  });

  it('applies the Level first, then the orientation and the view', () => {
    const calls: string[] = [];
    const camera = { setView: vi.fn(() => calls.push('view')), setOrientation: vi.fn(() => calls.push('yaw')) };
    applyCameraPose({ x: 1, z: 2, zoom: 3, yaw: 4, level: -2 }, camera, () => calls.push('level'));
    expect(calls).toEqual(['level', 'yaw', 'view']);
    expect(camera.setView).toHaveBeenCalledWith({ x: 1, z: 2, zoom: 3 });
  });

  it('parses a stored pose and refuses a broken one', () => {
    expect(parseCameraPose({ x: 1, z: 2, zoom: 3, yaw: 0.5, level: 0 })).toEqual({ x: 1, z: 2, zoom: 3, yaw: 0.5, level: 0 });
    expect(parseCameraPose({ x: 1, z: 2, zoom: 3, yaw: 0.5, level: 7 })).toBeNull();
    expect(parseCameraPose({ x: 'a', z: 2, zoom: 3, yaw: 0.5, level: 0 })).toBeNull();
    expect(parseCameraPose(null)).toBeNull();
  });
});
