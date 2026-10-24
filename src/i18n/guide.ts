const texts = {
  'guide.name': ['Urbtopia Guide', 'Guide Urbtopia'],
  'guide.intro': ['Every building, road and crop of Urbtopia, and how the city works.', 'Tous les bâtiments, routes et cultures d’Urbtopia, et le fonctionnement de la ville.'],
  'guide.chooseLanguage': ['Choose a language', 'Choisissez une langue'],
  'guide.codex': ['Codex', 'Codex'],
  'guide.codexIntro': ['Every building, crop, road and water construction, with its unlock threshold and the figures of each Tier.', 'Chaque bâtiment, culture, route et construction sur l’eau, avec son seuil de déblocage et les chiffres de chaque niveau.'],
  'guide.entryCount': ['{count} entries', '{count} fiches'],
  'guide.gettingStarted': ['Getting started', 'Premiers pas'],
  'guide.mechanics': ['Mechanics', 'Mécaniques'],
  'guide.glossary': ['Glossary', 'Glossaire'],
  'guide.comingSoon': ['Coming soon', 'Bientôt'],
  'guide.play': ['Play', 'Jouer'],
  'guide.openMenu': ['Open the menu', 'Ouvrir le menu'],
  'guide.closeMenu': ['Close the menu', 'Fermer le menu'],
  'guide.toggleTheme': ['Switch between light and dark', 'Basculer entre clair et sombre'],
  'guide.otherLanguage': ['Français', 'English'],
  'guide.readerSettings': ['Show the figures for', 'Afficher les chiffres pour'],
  'guide.difficulty': ['Difficulty', 'Difficulté'],
  'guide.citizens': ['{count} Citizens', '{count} habitants'],
  'guide.citizensLabel': ['City size', 'Taille de la ville'],
  'guide.search': ['Search', 'Rechercher'],
  'guide.searchPlaceholder': ['Search a building, a crop, a rule…', 'Chercher un bâtiment, une culture, une règle…'],
  'guide.noResults': ['Nothing matches this search.', 'Aucun résultat pour cette recherche.'],
  'guide.viewer3d': ['3D model, drag to turn it', 'Modèle 3D, faites-le tourner en le glissant'],
  'guide.viewer3dShow': ['View in 3D', 'Voir en 3D'],
  'guide.viewer3dHide': ['Back to the picture', 'Revenir à l’image'],
  'guide.viewer3dLoading': ['Loading the model…', 'Chargement du modèle…'],
  'guide.viewer3dFailed': ['The 3D view is not available on this device.', 'La vue 3D n’est pas disponible sur cet appareil.'],
  'guide.navigation': ['Guide navigation', 'Navigation du Guide'],
} as const;

export type GuideMessageKey = keyof typeof texts;

export function guideMessages(language: 'en' | 'fr'): Record<GuideMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<GuideMessageKey, string>;
}
