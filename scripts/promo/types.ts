import type { Stage } from './stage.ts';

// The parts of the interface a scene shows; every other part is hidden, except the main menu that is always shown.
export type UiPart = 'hud' | 'camera' | 'build' | 'selection' | 'panel';

export interface SceneOptions {
  ui?: UiPart[];
  state?: string;
  language?: 'en' | 'fr';
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

export interface Scenario {
  name: string;
  audio?: string;
  scenes: Scene[];
}

export const DEFAULT_VIEWPORT = { width: 1080, height: 768 };

export function scene(name: string, options: SceneOptions, play: Scene['play']): Scene {
  return { name, options, play };
}

export function scenario(name: string, scenes: Scene[], audio?: string): Scenario {
  return { name, scenes, audio };
}
