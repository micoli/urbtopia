const texts = {
  'guide.name': ['Urbtopia Guide', 'Guide Urbtopia'],
  'guide.intro': ['Every building, road and crop of Urbtopia, and how the city works.', 'Tous les bâtiments, routes et cultures d’Urbtopia, et le fonctionnement de la ville.'],
  'guide.chooseLanguage': ['Choose a language', 'Choisissez une langue'],
  'guide.codex': ['Codex', 'Codex'],
  'guide.gettingStarted': ['Getting started', 'Premiers pas'],
  'guide.mechanics': ['Mechanics', 'Mécaniques'],
  'guide.glossary': ['Glossary', 'Glossaire'],
  'guide.comingSoon': ['Coming soon', 'Bientôt'],
  'guide.play': ['Play', 'Jouer'],
  'guide.openMenu': ['Open the menu', 'Ouvrir le menu'],
  'guide.closeMenu': ['Close the menu', 'Fermer le menu'],
  'guide.toggleTheme': ['Switch between light and dark', 'Basculer entre clair et sombre'],
  'guide.otherLanguage': ['Français', 'English'],
  'guide.navigation': ['Guide navigation', 'Navigation du Guide'],
} as const;

export type GuideMessageKey = keyof typeof texts;

export function guideMessages(language: 'en' | 'fr'): Record<GuideMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<GuideMessageKey, string>;
}
