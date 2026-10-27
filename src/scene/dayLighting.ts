export interface DayLighting {
  sunColor: number;
  sunIntensity: number;
  skyColor: number;
  groundColor: number;
  hemisphereIntensity: number;
  background: number;
  environmentIntensity: number;
}

const DAY: DayLighting = {
  sunColor: 0xfff2d6, sunIntensity: 1.7,
  skyColor: 0xbcd8f5, groundColor: 0x8a7a64, hemisphereIntensity: 0.5,
  background: 0x9ec5e8, environmentIntensity: 0.25,
};

// A bluish dusk, never black: about 40% of the day light, so the grid and the colours stay readable.
const NIGHT: DayLighting = {
  sunColor: 0x5a7bd6, sunIntensity: 0.7,
  skyColor: 0x4a63b8, groundColor: 0x2a3050, hemisphereIntensity: 0.3,
  background: 0x1f2c4d, environmentIntensity: 0.1,
};

const SUNRISE_SUN = 0xffa564;
const SUNRISE_BACKGROUND = 0xd9906a;

const channel = (color: number, shift: number): number => (color >> shift) & 0xff;

export function mixColor(from: number, to: number, amount: number): number {
  const mixed = (shift: number) => Math.round(channel(from, shift) + (channel(to, shift) - channel(from, shift)) * amount);
  return (mixed(16) << 16) | (mixed(8) << 8) | mixed(0);
}

const mix = (from: number, to: number, amount: number): number => from + (to - from) * amount;

// `daylight` is 1 in Daytime, 0 in full Night and between 0 and 1 during dawn and dusk, which are warmer.
export function lightingOf(daylight: number): DayLighting {
  const level = Math.min(1, Math.max(0, daylight));
  const warmth = 4 * level * (1 - level);
  return {
    sunColor: mixColor(mixColor(NIGHT.sunColor, DAY.sunColor, level), SUNRISE_SUN, 0.6 * warmth),
    sunIntensity: mix(NIGHT.sunIntensity, DAY.sunIntensity, level),
    skyColor: mixColor(NIGHT.skyColor, DAY.skyColor, level),
    groundColor: mixColor(NIGHT.groundColor, DAY.groundColor, level),
    hemisphereIntensity: mix(NIGHT.hemisphereIntensity, DAY.hemisphereIntensity, level),
    background: mixColor(mixColor(NIGHT.background, DAY.background, level), SUNRISE_BACKGROUND, 0.35 * warmth),
    environmentIntensity: mix(NIGHT.environmentIntensity, DAY.environmentIntensity, level),
  };
}

export const DAY_BACKGROUND = DAY.background;
