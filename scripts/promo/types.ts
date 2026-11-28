import type { Stage } from './stage.ts';

// The parts of the interface a scene shows; every other part is hidden, except the main menu that is always shown.
export type UiPart = 'hud' | 'camera' | 'build' | 'selection' | 'panel';

export interface SceneOptions {
  ui?: UiPart[];
  state?: string;
  language?: 'en' | 'fr';
  // A Kokoro voice for `stage.say`; by default one of the language.
  voice?: string;
  // Hides the tax bubbles over the buildings when they crowd the shot.
  hideTaxBadges?: boolean;
  time?: string;
  viewport?: { width: number; height: number };
}

export interface Scene {
  name: string;
  options: SceneOptions;
  play: (stage: Stage) => Promise<void>;
}

export interface ScenarioOptions {
  // A music track mixed under the voice.
  audio?: string;
  // Between scenes: a fade through black, or a plain cut.
  transition?: 'fade' | 'cut';
}

export interface Scenario extends ScenarioOptions {
  name: string;
  scenes: Scene[];
}

export const DEFAULT_VIEWPORT = { width: 1080, height: 768 };

// Formats of a video: the whole scenario is filmed again at the size of the format (`--format=phone`).
export const FORMATS = {
  landscape: DEFAULT_VIEWPORT,
  phone: { width: 720, height: 1280 },
} as const;
export type Format = keyof typeof FORMATS;

export function scene(name: string, options: SceneOptions, play: Scene['play']): Scene {
  return { name, options, play };
}

export function scenario(name: string, scenes: Scene[], options: ScenarioOptions = {}): Scenario {
  return { name, scenes, ...options };
}
