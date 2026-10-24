import { describe, expect, it } from 'vitest';
import { readCameraView, writeCameraView } from './cameraUrl';

describe('readCameraView', () => {
  it('reads the position and zoom parameters', () => {
    expect(readCameraView('?x=10.5&z=20&zoom=40')).toEqual({ x: 10.5, z: 20, zoom: 40 });
  });

  it('ignores missing, empty and non numeric values', () => {
    expect(readCameraView('')).toEqual({});
    expect(readCameraView('?x=&z=abc&zoom=')).toEqual({});
    expect(readCameraView('?x=5')).toEqual({ x: 5 });
  });
});

describe('writeCameraView', () => {
  it('keeps the other parameters and rounds the view', () => {
    expect(writeCameraView('?bypass-tutorial', { x: 10.12345, z: 20, zoom: 36.789 })).toBe('?bypass-tutorial=&x=10.12&z=20&zoom=36.79');
  });

  it('replaces a previous view', () => {
    expect(writeCameraView('?x=1&z=2&zoom=3', { x: 4, z: 5, zoom: 6 })).toBe('?x=4&z=5&zoom=6');
  });
});
