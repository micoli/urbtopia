const texts = {
  'beta.section': ['Beta features', 'Fonctionnalités bêta'],
  'beta.subscribe': ['Join the beta', 'Rejoindre la bêta'],
  'beta.subscribe.description': ['Try features still in test before they ship. They may change, break or disappear, and are kept on this device only.', 'Essayez des fonctionnalités encore en test avant leur sortie. Elles peuvent changer, casser ou disparaître, et ne sont gardées que sur cet appareil.'],
  'beta.flag.clubs': ['Clubs', 'Clubs'],
  'beta.flag.clubs.description': ['Football, baseball and basketball clubs: squad, line-up, championship, matches.', 'Clubs de football, de baseball et de basket : effectif, composition, championnat, matchs.'],
  'beta.flag.advisor': ['Advisor', 'Conseiller'],
  'beta.flag.advisor.description': ['A local assistant that explains your city. Then turn it on in the Game tab.', 'Un assistant local qui explique votre ville. Activez-le ensuite dans l\'onglet Partie.'],
  'beta.flag.homeInterior': ['Home furnishing', 'Aménagement des logements'],
  'beta.flag.productionInterior': ['Production interiors', 'Intérieurs de production'],
  'beta.flag.productionInterior.description': ['Open the interior of the Mill, the Bakery, the Dairy and the Storehouse: machines, lines and Staff.', 'Ouvrez l\'intérieur de la minoterie, de la boulangerie, de la laiterie et de l\'entrepôt : machines, chaînes et personnel.'],
  'beta.flag.serviceInterior': ['Service interiors', 'Intérieurs de service'],
  'beta.flag.serviceInterior.description': ['Open the interior of the School, the Library and the Hospital: furniture and Staff.', 'Ouvrez l\'intérieur de l\'école, de la bibliothèque et de l\'hôpital : mobilier et personnel.'],
  'beta.flag.replan': ['City replanning', 'Réaménagement de la ville'],
  'beta.flag.replan.description': ['Lift everything you placed into a Stash to lay out roads, water and buildings again; the game stands still meanwhile.', 'Décrochez tout ce qui est posé dans une réserve pour replacer routes, eau et bâtiments ; le jeu se fige pendant ce temps.'],
  'beta.flag.homeInterior.description': ['Open the interior of a Home: furniture, paintings, parquet and comfort.', 'Ouvrez l\'intérieur d\'un logement : meubles, tableaux, parquet et confort.'],
};

export type BetaMessageKey = keyof typeof texts;

export function betaMessages(language: 'en' | 'fr'): Record<BetaMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<BetaMessageKey, string>;
}
