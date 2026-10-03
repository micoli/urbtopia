import { describe, expect, it } from 'vitest';
import { keyDirectionForYaw } from './cameraKeys';

const DEFAULT_YAW = Math.PI / 4;
const QUARTER = Math.PI / 2;

describe('keyDirectionForYaw', () => {
  it('keeps the grid axes at the default view', () => {
    expect(keyDirectionForYaw({ x: 0, z: -1 }, DEFAULT_YAW)).toEqual({ x: 0, z: -1 });
    expect(keyDirectionForYaw({ x: 1, z: 0 }, DEFAULT_YAW)).toEqual({ x: 1, z: 0 });
  });

  it('turns the keys with the board, one quarter turn at a time', () => {
    expect(keyDirectionForYaw({ x: 0, z: -1 }, DEFAULT_YAW + QUARTER)).toEqual({ x: -1, z: 0 });
    expect(keyDirectionForYaw({ x: 0, z: -1 }, DEFAULT_YAW + 2 * QUARTER)).toEqual({ x: 0, z: 1 });
    expect(keyDirectionForYaw({ x: 0, z: -1 }, DEFAULT_YAW + 3 * QUARTER)).toEqual({ x: 1, z: 0 });
  });

  it('handles turns in the other direction and full turns', () => {
    expect(keyDirectionForYaw({ x: 0, z: -1 }, DEFAULT_YAW - QUARTER)).toEqual({ x: 1, z: 0 });
    expect(keyDirectionForYaw({ x: 0, z: -1 }, DEFAULT_YAW + 4 * QUARTER)).toEqual({ x: 0, z: -1 });
  });
});
