const texts = {
  'challenge.daily.0': ['{item} rush', 'Ruée sur {item}'],
  'challenge.daily.1': ['Today: {item}', 'Au programme : {item}'],
  'challenge.daily.2': ['The {item} run', 'La course aux {item}'],
  'challenge.daily.3': ['Full steam on {item}', 'Cap sur {item}'],
  'challenge.daily.4': ['{item} fever', 'Fièvre de {item}'],
  'challenge.daily.5': ['Deliver the {item}', 'Livraison de {item}'],
  'challenge.daily.6': ['The big {item} day', 'Le grand jour de {item}'],
  'challenge.daily.7': ['{item} on demand', '{item} à la demande'],
  'challenge.event.0': ['{item} festival', 'Festival de {item}'],
  'challenge.event.1': ['The great {item} gathering', 'Le grand rassemblement de {item}'],
  'challenge.event.2': ['{item} week', 'La semaine de {item}'],
  'challenge.event.3': ['Grand {item} fair', 'Foire de {item}'],
  'challenge.event.4': ['The {item} celebration', 'La fête de {item}'],
  'challenge.event.5': ['{item} marathon', 'Marathon de {item}'],
  'market.tab.market': ['Market', 'Marché'],
  'market.tab.events': ['Events', 'Événements'],
  'challenge.loading': ['Loading the Challenges…', 'Chargement des défis…'],
  'challenge.offline': ['Offline: the Challenges shown may be out of date.', 'Hors ligne : les défis affichés ne sont peut-être pas à jour.'],
  'challenge.unavailable': ['Challenges need an online game.', 'Les défis demandent une partie en ligne.'],
  'challenge.empty': ['No Challenge for your city right now.', 'Aucun défi pour votre ville pour le moment.'],
  'challenge.kind.daily': ['Daily challenge', 'Défi du jour'],
  'challenge.kind.event': ['Event', 'Événement'],
  'challenge.rewardUrbs': ['Reward: {amount} {U} when the stock is complete before the deadline. Otherwise the units set aside are lost.', 'Récompense : {amount} {U} si le stock est complet avant l’échéance. Sinon, les unités mises de côté sont perdues.'],
  'challenge.rewardMedal': ['Reward: a Medal. The units set aside are consumed.', 'Récompense : une médaille. Les unités mises de côté sont consommées.'],
  'challenge.accept': ['Accept', 'Accepter'],
  'challenge.busy': ['Finish your current Challenge first.', 'Terminez d’abord votre défi en cours.'],
  'challenge.current': ['In progress', 'En cours'],
  'challenge.timeLeft': ['Time left: {time}', 'Temps restant : {time}'],
  'challenge.progress': ['{done} / {total}', '{done} / {total}'],
  'challenge.setAsideOne': ['Set aside 1', 'Mettre 1 de côté'],
  'challenge.setAsideMax': ['Set aside {count}', 'Mettre {count} de côté'],
  'challenge.noTimeSkip': ['Time cannot be skipped while a Challenge is in progress.', 'Impossible d’avancer le temps pendant un défi.'],
  'challenge.error.offline': ['No connection. Try again later.', 'Pas de connexion. Réessayez plus tard.'],
  'challenge.error.unauthenticated': ['Sign in to take part in Challenges.', 'Connectez-vous pour participer aux défis.'],
  'challenge.error.email-required': ['Attach an email to your account to take part in Challenges.', 'Associez un email à votre compte pour participer aux défis.'],
  'challenge.error.handle-required': ['Choose a Handle in Social to take part in Challenges.', 'Choisissez un pseudo dans Social pour participer aux défis.'],
  'challenge.error.challenge-unavailable': ['This Challenge is no longer available.', 'Ce défi n’est plus disponible.'],
  'challenge.error.challenge-busy': ['Another Challenge is already in progress.', 'Un autre défi est déjà en cours.'],
  'challenge.error.unknown': ['Something went wrong. Try again.', 'Un problème est survenu. Réessayez.'],
} as const satisfies Record<string, readonly [string, string]>;

export type ChallengeMessageKey = keyof typeof texts;

export const DAILY_HOOK_COUNT = 8;
export const EVENT_HOOK_COUNT = 6;

export function challengeMessages(language: 'en' | 'fr'): Record<ChallengeMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<ChallengeMessageKey, string>;
}
