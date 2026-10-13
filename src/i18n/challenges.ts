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
} as const satisfies Record<string, readonly [string, string]>;

export type ChallengeMessageKey = keyof typeof texts;

export const DAILY_HOOK_COUNT = 8;
export const EVENT_HOOK_COUNT = 6;

export function challengeMessages(language: 'en' | 'fr'): Record<ChallengeMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<ChallengeMessageKey, string>;
}
