const texts = {
  'diagnosis.jobs.short': [
    'The city offers {jobs} Jobs for {citizens} Citizens, so {unemployed} have none. Build workplaces (Offices, Shops, Workshops), or hire Staff in your Venues.',
    'La ville offre {jobs} emplois pour {citizens} habitants, donc {unemployed} n’en ont pas. Construisez des lieux de travail (bureaux, commerces, ateliers), ou embauchez du personnel dans vos lieux.',
  ],
  'diagnosis.jobs.unreachable': [
    'There are enough Jobs, but {unemployed} Citizens in {homes} Homes cannot reach any. Build workplaces near those Homes, or link them to the Jobs by road or public transport.',
    'Il y a assez d’emplois, mais {unemployed} habitants de {homes} logements n’en atteignent aucun. Construisez des lieux de travail près de ces logements, ou reliez-les aux emplois par la route ou les transports en commun.',
  ],
};

export type JobsDiagnosisMessageKey = keyof typeof texts;

export function jobsDiagnosisMessages(language: 'en' | 'fr'): Record<JobsDiagnosisMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<JobsDiagnosisMessageKey, string>;
}
