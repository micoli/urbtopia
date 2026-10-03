const DEFAULT_YAW = Math.PI / 4;
const QUARTER_TURN = Math.PI / 2;

interface Direction {
  x: number;
  z: number;
}

export function keyDirectionForYaw(direction: Direction, yaw: number): Direction {
  const quarterTurns = (((Math.round((yaw - DEFAULT_YAW) / QUARTER_TURN) % 4) + 4) % 4) as 0 | 1 | 2 | 3;
  const rotated = [
    { x: direction.x, z: direction.z },
    { x: direction.z, z: -direction.x },
    { x: -direction.x, z: -direction.z },
    { x: -direction.z, z: direction.x },
  ][quarterTurns] as Direction;
  return { x: rotated.x || 0, z: rotated.z || 0 };
}
