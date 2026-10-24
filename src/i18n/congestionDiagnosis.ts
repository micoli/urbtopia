const texts = {
  'diagnosis.congestion.untouchedTiers': [
    '{tier1} of your {saturated} saturated road tiles are still Tier 1. Upgrading them to a higher Tier raises their capacity.',
    '{tier1} de vos {saturated} cases de route saturées sont encore de niveau 1. Les passer à un niveau supérieur augmente leur capacité.',
  ],
  'diagnosis.congestion.corridor': [
    'One busy road, {length} tiles long between ({fromX}, {fromY}) and ({toX}, {toY}), carries about {load} Commuters for a capacity of {capacity}. Widen it, or give your Commuters another way round.',
    'Une route très chargée, longue de {length} cases entre ({fromX}, {fromY}) et ({toX}, {toY}), porte environ {load} Commuters pour une capacité de {capacity}. Élargissez-la, ou offrez un autre chemin à vos Commuters.',
  ],
  'diagnosis.congestion.crossingsChoke': [
    'Pedestrian Crossings on {count} saturated tiles take up to {cut}% of their capacity. Move them off the busy roads, or use a Roundabout.',
    'Des passages piétons sur {count} cases saturées leur retirent jusqu’à {cut} % de capacité. Éloignez-les des routes chargées, ou utilisez un rond-point.',
  ],
  'diagnosis.congestion.homesFarFromJobs': [
    'Most Homes are around ({homeX}, {homeY}) but most Jobs around ({jobX}, {jobY}), {distance} tiles apart. Build workplaces and services near the Homes, or a public transport line between the two.',
    'La plupart des Homes sont autour de ({homeX}, {homeY}) mais la plupart des emplois autour de ({jobX}, {jobY}), à {distance} cases. Construisez des lieux de travail et des services près des Homes, ou une ligne de transport entre les deux.',
  ],
  'diagnosis.congestion.noTransit': [
    '{car}% of trips are by car and the city has no public transport line. Build Bus stops and a Bus line, or a BRT, to take Commuters off the road.',
    '{car} % des trajets se font en voiture et la ville n’a aucune ligne de transport en commun. Construisez des arrêts et une ligne de bus, ou un BRT, pour sortir des Commuters de la route.',
  ],
  'diagnosis.congestion.carHeavy': [
    '{car}% of trips are by car and only {shifted} Commuters have switched to public transport. Your lines may be full or miss the busy Homes: extend them.',
    '{car} % des trajets se font en voiture et seulement {shifted} Commuters sont passés aux transports en commun. Vos lignes sont peut-être pleines ou n’atteignent pas les Homes chargés : prolongez-les.',
  ],
  'diagnosis.congestion.disconnected': [
    '{homes} Homes are cut off from every workplace by the road network, so their Commuters have no route. Link their roads to a workplace.',
    '{homes} Homes sont coupés de tout lieu de travail par le réseau routier : leurs Commuters n’ont aucun itinéraire. Reliez leurs routes à un lieu de travail.',
  ],
};

export type CongestionDiagnosisMessageKey = keyof typeof texts;

export function congestionDiagnosisMessages(language: 'en' | 'fr'): Record<CongestionDiagnosisMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<CongestionDiagnosisMessageKey, string>;
}
