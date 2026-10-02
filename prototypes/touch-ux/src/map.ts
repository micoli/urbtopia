export const MAP_MIN = -18
export const MAP_MAX = 17
const mod = (n: number, m: number) => ((n % m) + m) % m

export const inBounds = (x: number, z: number) => x >= MAP_MIN && x <= MAP_MAX && z >= MAP_MIN && z <= MAP_MAX
export const isRoad = (x: number, z: number) => mod(x, 6) === 0 || mod(z, 6) === 0
export const isCrossroad = (x: number, z: number) => mod(x, 6) === 0 && mod(z, 6) === 0
export const tileKey = (x: number, z: number) => `${x},${z}`
