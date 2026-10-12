const texts = {
  'difficulty.cozy': ['Cozy', 'Cozy'],
  'difficulty.easy': ['Easy', 'Facile'],
  'difficulty.medium': ['Medium', 'Moyen'],
  'difficulty.hard': ['Hard', 'Difficile'],
  'difficulty.none': ['No Sanction: a neglected Home keeps its full Tax.', 'Aucune Sanction : un Home négligé garde tous ses impôts.'],
  'difficulty.sanctions': ['A Home loses up to {percent}% of its Tax when the weakest of these is unmet: {factors}.', 'Un Home perd jusqu’à {percent} % de ses impôts quand le plus faible de ces facteurs n’est pas satisfait : {factors}.'],
  'difficulty.newGame': ['Difficulty of the new city', 'Difficulté de la nouvelle ville'],
  'difficulty.title': ['Difficulty', 'Difficulté'],
} as const satisfies Record<string, readonly [string, string]>;

export type DifficultyMessageKey = keyof typeof texts;

export function difficultyMessages(language: 'en' | 'fr'): Record<DifficultyMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<DifficultyMessageKey, string>;
}
