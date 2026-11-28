import type { Stage } from './stage.ts';

// The parts of the interface a scene shows; every other part is hidden, except the main menu that is always shown.
export type UiPart = 'hud' | 'camera' | 'build' | 'selection' | 'panel' | 'analytics';

export interface SceneOptions {
  ui?: UiPart[];
  state?: string;
  language?: Language;
  // A Kokoro voice for `stage.say`; by default one of the language.
  voice?: string;
  // The scene starts from the state the previous scene ended in, not from a save file: a film cut into scenes goes on where it stopped.
  from?: 'previous';
  // What the scene's code is made of, for the cache: the source of its sequences and of what they lean on. A scene is filmed again only when it changes.
  sources?: string[];
  // Features that ship switched off, switched on for the scene: `clubs`.
  flags?: string[];
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

export type Language = 'en' | 'fr';
export const LANGUAGES: readonly Language[] = ['en', 'fr'];

// A scenario is written once and built for each language: `build` gets the language and returns the scenes, with their captions and lines in it.
export interface Scenario extends ScenarioOptions {
  name: string;
  build: (language: Language) => Scene[];
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

export function scenario(name: string, build: Scenario['build'], options: ScenarioOptions = {}): Scenario {
  return { name, build, ...options };
}
