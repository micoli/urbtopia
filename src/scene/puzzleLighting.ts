import * as THREE from 'three';
import { lightingOf } from './dayLighting';

export interface PuzzleLighting {
  exposure: number;
  toneMapping: THREE.ToneMapping;
  sunColor: number;
  sunIntensity: number;
  skyColor: number;
  groundColor: number;
  hemisphereIntensity: number;
  environmentIntensity: number;
  background: number;
}

const day = lightingOf(1, true);

// The lighting of the city, for comparison: a strong sun and almost no ambient light, which leaves a lit face at about 60% of its painted colour.
const CITY: PuzzleLighting = { ...day, exposure: 0.8, toneMapping: THREE.NeutralToneMapping };

// White light with plenty of ambient light, so that a face keeps the colour it was painted in, lit or in the shade. Tuned in the puzzle lab with its colour measure: a face turned to the
// camera draws within 5% of the brightness it was painted in, and white stays white, where the city lighting draws it at 47% to 79% and tints it warm.
const VIVID: PuzzleLighting = {
  exposure: 1,
  toneMapping: THREE.NeutralToneMapping,
  sunColor: 0xffffff, sunIntensity: 2,
  skyColor: 0xffffff, groundColor: 0xdde6f0, hemisphereIntensity: 1,
  environmentIntensity: 0.2,
  background: day.background,
};

export const PUZZLE_LIGHTINGS = { city: CITY, vivid: VIVID } satisfies Record<string, PuzzleLighting>;

export type PuzzleLightingName = keyof typeof PUZZLE_LIGHTINGS;
