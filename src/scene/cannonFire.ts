const PERIOD_SECONDS = 2.6;
const PUFF_SECONDS = 1.1;
const FLASH_SHARE = 0.14;

export const GUNS_PER_SIDE = 2;

export interface CannonPuff {
  // How far it has drifted from the side of the hull, and risen, in tiles.
  travel: number;
  rise: number;
  size: number;
  flash: boolean;
}

// Each gun fires on its own beat, drawn from the ship, its side and its place on the hull. Null when it is silent.
export function cannonPuff(shipId: number, side: 1 | -1, gun: number, clock: number): CannonPuff | null {
  const offset = ((shipId * 0.73 + (side === 1 ? 0.41 : 0) + gun * 0.29) % 1) * PERIOD_SECONDS;
  const elapsed = (clock + offset) % PERIOD_SECONDS;
  if (elapsed >= PUFF_SECONDS) return null;
  const progress = elapsed / PUFF_SECONDS;
  return {
    travel: 0.1 + progress * 0.56,
    rise: progress * 0.44,
    size: Math.sin(Math.PI * Math.min(1, progress * 1.15)) * 0.2 + 0.03,
    flash: progress < FLASH_SHARE,
  };
}
