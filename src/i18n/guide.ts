const texts = {
  'guide.name': ['Urbtopia Guide', 'Guide Urbtopia'],
  'guide.intro': ['Every building, road and crop of Urbtopia, and how the city works.', 'Tous les bâtiments, routes et cultures d’Urbtopia, et le fonctionnement de la ville.'],
  'guide.chooseLanguage': ['Choose a language', 'Choisissez une langue'],
  'guide.codex': ['Codex', 'Codex'],
} as const;

export type GuideMessageKey = keyof typeof texts;

export function guideMessages(language: 'en' | 'fr'): Record<GuideMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<GuideMessageKey, string>;
}
