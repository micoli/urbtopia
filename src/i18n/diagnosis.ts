const texts = {
  'diagnosis.title': ['Why?', 'Pourquoi ?'],
  'diagnosis.showOnMap': ['Show on map', 'Voir sur la carte'],
  'diagnosis.showLayer': ['Show the {layer} layer', 'Voir le calque {layer}'],
};

export type DiagnosisMessageKey = keyof typeof texts;

export function diagnosisMessages(language: 'en' | 'fr'): Record<DiagnosisMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<DiagnosisMessageKey, string>;
}
