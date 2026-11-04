const texts = {
  'beta.section': ['Beta features', 'Fonctionnalités bêta'],
  'beta.subscribe': ['Join the beta', 'Rejoindre la bêta'],
  'beta.subscribe.description': ['Try features still in test before they ship. They may change, break or disappear, and are kept on this device only.', 'Essayez des fonctionnalités encore en test avant leur sortie. Elles peuvent changer, casser ou disparaître, et ne sont gardées que sur cet appareil.'],
  'beta.flag.clubs': ['Clubs', 'Clubs'],
  'beta.flag.clubs.description': ['Football and baseball clubs: squad, line-up, championship, matches.', 'Clubs de football et de baseball : effectif, composition, championnat, matchs.'],
  'beta.flag.advisor': ['Advisor', 'Conseiller'],
  'beta.flag.advisor.description': ['A local assistant that explains your city. Then turn it on in the Game tab.', 'Un assistant local qui explique votre ville. Activez-le ensuite dans l\'onglet Partie.'],
};

export type BetaMessageKey = keyof typeof texts;

export function betaMessages(language: 'en' | 'fr'): Record<BetaMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<BetaMessageKey, string>;
}
