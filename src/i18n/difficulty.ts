const texts = {
  'difficulty.cozy': ['Cozy', 'Cozy'],
  'difficulty.easy': ['Easy', 'Facile'],
  'difficulty.medium': ['Medium', 'Moyen'],
  'difficulty.hard': ['Hard', 'Difficile'],
  'difficulty.title': ['Difficulty', 'Difficulté'],
} as const satisfies Record<string, readonly [string, string]>;

export type DifficultyMessageKey = keyof typeof texts;

export function difficultyMessages(language: 'en' | 'fr'): Record<DifficultyMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<DifficultyMessageKey, string>;
}
